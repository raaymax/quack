use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::routing::{get, put};
use axum::{Json, Router};
use bson::{Bson, DateTime, Document, doc};
use futures::TryStreamExt;
use mongodb::options::FindOptions;
use serde::Deserialize;
use serde_json::{Value, json};

use crate::auth::Auth;
use crate::doc::{DocExt, doc_to_json, from_json, oid, oids};
use crate::domain::message::{self, NewMessage};
use crate::domain::{channel, file};
use crate::error::{AppError, AppResult};
use crate::extract::{Body, Query, query_bool, query_number};
use crate::state::AppState;

pub fn channel_router() -> Router<AppState> {
    Router::new().route("/", get(list).post(create))
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/{message_id}", get(get_one).patch(update).delete(remove))
        .route("/{message_id}/pin", put(pin))
        .route("/{message_id}/react", put(react))
}

#[derive(Deserialize)]
struct ListQuery {
    #[serde(rename = "parentId")]
    parent_id: Option<String>,
    pinned: Option<String>,
    before: Option<String>,
    after: Option<String>,
    limit: Option<String>,
    offset: Option<String>,
    order: Option<String>,
    q: Option<String>,
}

fn date(name: &str, value: Option<&str>) -> AppResult<Option<DateTime>> {
    value
        .map(|v| {
            chrono::DateTime::parse_from_rfc3339(v)
                .map(|d| DateTime::from_millis(d.timestamp_millis()))
                .or_else(|_| v.parse::<i64>().map(DateTime::from_millis))
                .map_err(|_| {
                    AppError::invalid_field(&format!("/querystring/{name}"), "must be a date")
                })
        })
        .transpose()
}

async fn list(
    State(state): State<AppState>,
    auth: Auth,
    Path(channel_id): Path<String>,
    Query(q): Query<ListQuery>,
) -> AppResult<Json<Value>> {
    let channel_id = oid(&channel_id)?;
    let parent_id = match q.parent_id.as_deref() {
        None => None,
        Some("null") => Some(None),
        Some(id) => Some(Some(oid(id)?)),
    };
    let pinned = query_bool("pinned", q.pinned.as_deref())?;
    let before = date("before", q.before.as_deref())?;
    let after = date("after", q.after.as_deref())?;
    let limit = query_number("limit", q.limit.as_deref())?.unwrap_or(50);
    let offset = query_number("offset", q.offset.as_deref())?.unwrap_or(0);
    let order = match q.order.as_deref() {
        None => {
            if after.is_some() {
                1
            } else {
                -1
            }
        }
        Some("asc") => 1,
        Some("desc") => -1,
        Some(_) => {
            return Err(AppError::invalid_field(
                "/querystring/order",
                "must be equal to one of the allowed values",
            ));
        }
    };

    channel::access(&state, channel_id, auth.user_id).await?;

    let mut filter = doc! { "channelId": channel_id };
    if let Some(search) = q.q.as_deref().filter(|s| !s.is_empty()) {
        filter.insert("$text", doc! { "$search": search });
    }
    if let Some(before) = before {
        filter.insert("createdAt", doc! { "$lte": before });
    }
    if let Some(after) = after {
        filter.insert("createdAt", doc! { "$gte": after });
    }
    if let Some(parent) = parent_id {
        filter.insert("parentId", message::parent_filter(parent));
    }
    if pinned == Some(true) {
        filter.insert("pinned", true);
    }

    let options = FindOptions::builder()
        .sort(doc! { "createdAt": order })
        .skip(offset.max(0) as u64)
        .limit(limit)
        .build();
    let mut messages: Vec<Document> = state
        .db
        .messages()
        .find(filter)
        .with_options(options)
        .await?
        .try_collect()
        .await?;
    if after.is_some() {
        messages.reverse();
    }

    let parent = match parent_id.flatten() {
        Some(parent_id) => Some(
            state
                .db
                .messages()
                .find_one(doc! { "_id": parent_id, "channelId": channel_id })
                .await?,
        ),
        None => None,
    };
    let mut all: Vec<Document> = parent.clone().flatten().into_iter().collect();
    all.extend(messages.iter().cloned());
    let files = file::resolve(&state, &all).await?;

    let mut out: Vec<Value> = Vec::with_capacity(messages.len() + 1);
    if let Some(parent) = parent {
        out.push(
            parent
                .map(|p| message::to_json(&p, &files))
                .unwrap_or(Value::Null),
        );
    }
    out.extend(messages.iter().map(|m| message::to_json(m, &files)));
    Ok(Json(Value::Array(out)))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateMessage {
    message: Option<Value>,
    flat: Option<String>,
    encrypted: Option<String>,
    #[serde(rename = "_iv")]
    iv: Option<String>,
    parent_id: Option<String>,
    client_id: Option<String>,
    #[serde(default)]
    emoji_only: bool,
    #[serde(default)]
    links: Vec<String>,
    #[serde(default)]
    mentions: Vec<String>,
    #[serde(default)]
    file_ids: Vec<String>,
}

crate::required!(CreateMessage);

async fn create(
    State(state): State<AppState>,
    auth: Auth,
    Path(channel_id): Path<String>,
    Body(body): Body<CreateMessage>,
) -> AppResult<Json<Value>> {
    let channel_id = oid(&channel_id)?;
    if body.message.is_none() && body.flat.is_none() && body.encrypted.is_none() {
        return Err(AppError::invalid_field(
            "",
            "must have any of message, flat, encrypted",
        ));
    }
    if body
        .message
        .as_ref()
        .is_some_and(|m| !message::valid_body(m))
    {
        return Err(AppError::invalid_field(
            "/message",
            "must match exactly one schema in oneOf",
        ));
    }
    let new = NewMessage {
        message: body.message,
        flat: body.flat,
        encrypted: body.encrypted,
        iv: body.iv,
        parent_id: body.parent_id.as_deref().map(oid).transpose()?,
        client_id: body.client_id,
        emoji_only: body.emoji_only,
        pinned: None,
        links: body.links,
        mentions: oids(&body.mentions)?,
        file_ids: oids(&body.file_ids)?,
    };
    let id = message::create(&state, auth.user_id, channel_id, new).await?;
    Ok(Json(message::get_visible(&state, id, auth.user_id).await?))
}

async fn get_one(
    State(state): State<AppState>,
    auth: Auth,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    Ok(Json(
        message::get_visible(&state, oid(&id)?, auth.user_id).await?,
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateMessage {
    pinned: Option<bool>,
    message: Option<Value>,
    flat: Option<String>,
    emoji_only: Option<bool>,
    links: Option<Vec<String>>,
    mentions: Option<Vec<String>>,
    file_ids: Option<Vec<String>>,
}

crate::required!(UpdateMessage);

async fn update(
    State(state): State<AppState>,
    auth: Auth,
    Path(id): Path<String>,
    Body(body): Body<UpdateMessage>,
) -> AppResult<StatusCode> {
    let id = oid(&id)?;
    if body
        .message
        .as_ref()
        .is_some_and(|m| !message::valid_body(m))
    {
        return Err(AppError::invalid_field(
            "/message",
            "must match exactly one schema in oneOf",
        ));
    }
    let existing = message::get(&state, id)
        .await?
        .ok_or_else(|| AppError::not_found("Message not found"))?;
    if existing.oid("userId") != Some(auth.user_id) {
        return Err(AppError::not_owner("Not owner"));
    }
    let file_ids = body.file_ids.as_deref().map(oids).transpose()?;
    let mut set = Document::new();
    if let Some(flat) = body.flat {
        set.insert("flat", flat);
    }
    if let Some(pinned) = body.pinned {
        set.insert("pinned", pinned);
    }
    if let Some(body) = &body.message {
        set.insert("message", from_json(body));
    }
    if let Some(emoji_only) = body.emoji_only {
        set.insert("emojiOnly", emoji_only);
    }
    if let Some(links) = body.links {
        set.insert("links", links);
    }
    if let Some(mentions) = &body.mentions {
        set.insert("mentions", oids(mentions)?);
    }
    if let Some(file_ids) = &file_ids {
        set.insert("fileIds", file_ids);
    }
    if !set.is_empty() {
        state
            .db
            .messages()
            .update_one(doc! { "_id": id }, doc! { "$set": set })
            .await?;
    }
    let updated = message::get(&state, id)
        .await?
        .ok_or_else(|| AppError::not_found("Message not found"))?;
    if let Some(file_ids) = file_ids {
        file::attach_to_message(&state, &file_ids, &updated, auth.user_id).await?;
    }
    state
        .events
        .message_updated(message::with_files(&state, &updated).await?);
    Ok(StatusCode::NO_CONTENT)
}

async fn remove(
    State(state): State<AppState>,
    auth: Auth,
    Path(id): Path<String>,
) -> AppResult<StatusCode> {
    let id = oid(&id)?;
    let existing = message::get(&state, id)
        .await?
        .ok_or_else(|| AppError::not_found("Message not found"))?;
    if existing.oid("userId") != Some(auth.user_id) {
        return Err(AppError::not_owner("Not owner"));
    }
    for file_id in existing.oid_list("fileIds") {
        file::remove(&state, file_id, auth.user_id).await?;
    }
    state.db.messages().delete_one(doc! { "_id": id }).await?;
    let channel_id = existing.oid("channelId");
    let members = match channel_id {
        Some(c) => channel::get(&state, c)
            .await?
            .map(|c| channel::members(&c))
            .unwrap_or_default(),
        None => Vec::new(),
    };
    state.bus.group(
        members,
        json!({
            "id": id.to_hex(),
            "type": "message",
            "channelId": channel_id.map(|c| c.to_hex()),
            "message": [],
            "user": { "name": "System" },
            "notifType": "warning",
            "notif": "Message removed",
        }),
        None,
    );
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
struct Pin {
    pinned: Option<bool>,
}

crate::required!(Pin);

async fn pin(
    State(state): State<AppState>,
    auth: Auth,
    Path(id): Path<String>,
    Body(body): Body<Pin>,
) -> AppResult<StatusCode> {
    let id = oid(&id)?;
    let existing = message::get(&state, id)
        .await?
        .ok_or_else(|| AppError::not_found("Message not found"))?;
    let channel_id = existing
        .oid("channelId")
        .ok_or_else(|| AppError::not_found("Channel not found"))?;
    channel::access(&state, channel_id, auth.user_id).await?;
    let pinned = body.pinned.map(Bson::Boolean).unwrap_or(Bson::Null);
    state
        .db
        .messages()
        .update_one(doc! { "_id": id }, doc! { "$set": { "pinned": pinned } })
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
struct React {
    reaction: String,
}

crate::required!(React, "reaction");

fn is_shortname(value: &str) -> bool {
    value.len() > 2
        && value.starts_with(':')
        && value.ends_with(':')
        && value[1..value.len() - 1]
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

async fn react(
    State(state): State<AppState>,
    auth: Auth,
    Path(id): Path<String>,
    Body(body): Body<React>,
) -> AppResult<StatusCode> {
    let id = oid(&id)?;
    if !is_shortname(&body.reaction) {
        return Err(AppError::invalid_field(
            "/reaction",
            "must match format \"emoji-shortname\"",
        ));
    }
    let existing = message::get(&state, id)
        .await?
        .ok_or_else(|| AppError::not_found("Message not found"))?;
    let channel_id = existing
        .oid("channelId")
        .ok_or_else(|| AppError::not_found("Channel not found"))?;
    let channel = channel::access(&state, channel_id, auth.user_id).await?;

    let mut reactions: Vec<Document> = existing
        .get_array("reactions")
        .map(|items| {
            items
                .iter()
                .filter_map(|r| r.as_document().cloned())
                .collect()
        })
        .unwrap_or_default();
    let position = reactions.iter().position(|r| {
        r.oid("userId") == Some(auth.user_id) && r.str("reaction") == Some(body.reaction.as_str())
    });
    match position {
        Some(index) => {
            reactions.remove(index);
        }
        None => reactions.push(doc! { "userId": auth.user_id, "reaction": &body.reaction }),
    }
    state
        .db
        .messages()
        .update_one(
            doc! { "_id": id },
            doc! { "$set": { "reactions": &reactions } },
        )
        .await?;

    let mut updated = existing;
    updated.insert("reactions", reactions);
    state.bus.group(
        channel::members(&channel),
        message::event(&doc_to_json(&updated)),
        None,
    );
    Ok(StatusCode::NO_CONTENT)
}
