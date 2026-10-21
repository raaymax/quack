use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::routing::{get, post, put};
use axum::{Json, Router};
use bson::doc;
use bson::oid::ObjectId;
use serde::Deserialize;
use serde_json::{Value, json};

use crate::auth::Auth;
use crate::doc::{doc_to_json, docs_to_json, oid, oids};
use crate::domain::channel::{self, PRIVATE, PUBLIC};
use crate::error::{AppError, AppResult};
use crate::extract::Body;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/{channel_id}", get(get_one).delete(remove))
        .route("/direct/{user_id}", put(put_direct).get(get_direct))
        .route("/{channel_id}/typing", post(typing))
}

async fn list(State(state): State<AppState>, auth: Auth) -> AppResult<Json<Value>> {
    use futures::TryStreamExt;
    let channels: Vec<_> = state
        .db
        .channels()
        .find(doc! { "users": { "$elemMatch": { "$eq": auth.user_id } } })
        .await?
        .try_collect()
        .await?;
    Ok(Json(docs_to_json(&channels)))
}

async fn member_channel(state: &AppState, id: ObjectId, user: ObjectId) -> AppResult<Json<Value>> {
    let channel = channel::get_for_member(state, id, user)
        .await?
        .ok_or_else(|| AppError::not_found("Channel not found"))?;
    Ok(Json(doc_to_json(&channel)))
}

async fn get_one(
    State(state): State<AppState>,
    auth: Auth,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    member_channel(&state, oid(&id)?, auth.user_id).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateChannel {
    name: String,
    description: Option<String>,
    channel_type: Option<String>,
    encryption_key: Option<String>,
    #[serde(default)]
    users: Vec<String>,
}

crate::required!(CreateChannel, "name");

async fn create(
    State(state): State<AppState>,
    auth: Auth,
    Body(body): Body<CreateChannel>,
) -> AppResult<Json<Value>> {
    let channel_type = body.channel_type.as_deref().unwrap_or(PUBLIC);
    match channel_type {
        PUBLIC | PRIVATE => {}
        channel::DIRECT => {
            return Err(AppError::bad_request(
                "INVALID_CHANNEL_VALUE",
                "Direct channel can't be created this way",
            ));
        }
        _ => {
            return Err(AppError::invalid_field(
                "/channelType",
                "must be equal to one of the allowed values",
            ));
        }
    }
    let users = oids(&body.users)?;
    channel::users_exist(&state, &users).await?;

    let channels = state.db.channels();
    if channel_type == PRIVATE {
        let existing = channels
            .find_one(doc! {
                "channelType": PRIVATE,
                "name": &body.name,
                "users": { "$elemMatch": { "$eq": auth.user_id } },
            })
            .await?;
        if let Some(existing) = existing {
            return member_channel(&state, crate::doc::id(&existing), auth.user_id).await;
        }
    } else if let Some(existing) = channels
        .find_one(doc! { "channelType": PUBLIC, "name": &body.name })
        .await?
    {
        let id = crate::doc::id(&existing);
        let joining: Vec<ObjectId> = std::iter::once(auth.user_id).chain(users).collect();
        channel::join(&state, id, &joining).await?;
        return member_channel(&state, id, auth.user_id).await;
    }

    let id = ObjectId::new();
    let members = std::iter::once(auth.user_id)
        .chain(users)
        .collect::<Vec<_>>();
    let doc = doc! {
        "_id": id,
        "name": &body.name,
        "description": body.description.unwrap_or_default(),
        "channelType": channel_type,
        "private": channel_type == PRIVATE,
        "direct": false,
        "users": &members,
        "encrypted": body.encryption_key.is_some(),
    };
    channels.insert_one(&doc).await?;
    state.bus.group(members, channel::event(&doc), None);
    member_channel(&state, id, auth.user_id).await
}

async fn remove(
    State(state): State<AppState>,
    auth: Auth,
    Path(id): Path<String>,
) -> AppResult<StatusCode> {
    state
        .db
        .channels()
        .delete_one(doc! { "_id": oid(&id)?, "users": { "$elemMatch": { "$eq": auth.user_id } } })
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn put_direct(
    State(state): State<AppState>,
    auth: Auth,
    Path(user): Path<String>,
) -> AppResult<Json<Value>> {
    let id = channel::put_direct(&state, &[auth.user_id, oid(&user)?]).await?;
    member_channel(&state, id, auth.user_id).await
}

async fn get_direct(
    State(state): State<AppState>,
    auth: Auth,
    Path(user): Path<String>,
) -> AppResult<Json<Value>> {
    let users = channel::unique([auth.user_id, oid(&user)?]);
    let channel = channel::find_direct(&state, &users).await?;
    Ok(Json(
        channel.as_ref().map(doc_to_json).unwrap_or(Value::Null),
    ))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Typing {
    parent_id: Option<String>,
}

crate::required!(Typing);

async fn typing(
    State(state): State<AppState>,
    auth: Auth,
    Path(id): Path<String>,
    Body(body): Body<Typing>,
) -> AppResult<StatusCode> {
    let channel_id = oid(&id)?;
    let parent_id = body.parent_id.as_deref().map(oid).transpose()?;
    let channel = channel::access(&state, channel_id, auth.user_id).await?;
    state.bus.group(
        channel::members(&channel),
        json!({
            "type": "typing",
            "userId": auth.user_id.to_hex(),
            "channelId": channel_id.to_hex(),
            "parentId": parent_id.map(|p| p.to_hex()),
        }),
        Some(auth.user_id),
    );
    Ok(StatusCode::NO_CONTENT)
}
