use axum::body::Body as RawBody;
use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use bson::oid::ObjectId;
use bson::{Document, doc};
use futures::TryStreamExt;
use serde_json::{Map, Value, json};

use crate::auth::Auth;
use crate::doc::{DocExt, doc_to_json, docs_to_json};
use crate::error::{AppError, AppResult};
use crate::routes::upload;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list))
        .route("/{shortname}", axum::routing::post(create).put(replace))
}

fn normalize(raw: &str) -> AppResult<String> {
    let trimmed = raw.trim();
    let inner = trimmed.strip_prefix(':').unwrap_or(trimmed);
    let inner = inner.strip_suffix(':').unwrap_or(inner);
    let valid = !inner.is_empty()
        && inner
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '+' | '-'));
    if !valid {
        return Err(AppError::invalid_field(
            "/params/shortname",
            "invalid emoji shortname, expected :shortname:",
        ));
    }
    Ok(format!(":{inner}:"))
}

fn event(emoji: &Document) -> Value {
    let Value::Object(fields) = doc_to_json(emoji) else {
        unreachable!()
    };
    let mut map = Map::new();
    map.insert("type".into(), json!("emoji"));
    map.extend(fields);
    Value::Object(map)
}

async fn list(State(state): State<AppState>, _auth: Auth) -> AppResult<Json<Value>> {
    let emojis: Vec<Document> = state.db.emojis().find(doc! {}).await?.try_collect().await?;
    Ok(Json(docs_to_json(&emojis)))
}

enum Mode {
    Create,
    Replace,
}

async fn create(
    state: State<AppState>,
    auth: Auth,
    shortname: Path<String>,
    headers: HeaderMap,
    body: RawBody,
) -> AppResult<Response> {
    save(state, auth, shortname, headers, body, Mode::Create).await
}

async fn replace(
    state: State<AppState>,
    auth: Auth,
    shortname: Path<String>,
    headers: HeaderMap,
    body: RawBody,
) -> AppResult<Response> {
    save(state, auth, shortname, headers, body, Mode::Replace).await
}

async fn save(
    State(state): State<AppState>,
    _auth: Auth,
    Path(shortname): Path<String>,
    headers: HeaderMap,
    body: RawBody,
    mode: Mode,
) -> AppResult<Response> {
    let shortname = normalize(&shortname)?;
    let opts = upload::opts(&headers, "emoji");
    if !opts.content_type.starts_with("image/") {
        let body = json!({ "errorCode": "INVALID_EMOJI", "message": "expected an image" });
        return Ok((StatusCode::BAD_REQUEST, Json(body)).into_response());
    }
    let (storage_id, _) = state.storage.upload(upload::stream(body), opts).await?;
    match persist(&state, &shortname, &storage_id, mode).await {
        Ok(emoji) => {
            state.bus.broadcast(event(&emoji));
            Ok(Json(json!({ "status": "ok", "emoji": doc_to_json(&emoji) })).into_response())
        }
        Err(e) => {
            let _ = state.storage.remove(&storage_id).await;
            Err(e)
        }
    }
}

async fn persist(
    state: &AppState,
    shortname: &str,
    storage_id: &str,
    mode: Mode,
) -> AppResult<Document> {
    let emojis = state.db.emojis();
    let existing = emojis.find_one(doc! { "shortname": shortname }).await?;
    let id = match (mode, existing) {
        (Mode::Create, Some(_)) => {
            return Err(AppError::conflict(
                "EMOJI_ALREADY_EXISTS",
                format!("emoji {shortname} already exists"),
            ));
        }
        (Mode::Create, None) => {
            let id = ObjectId::new();
            emojis
                .insert_one(doc! { "_id": id, "shortname": shortname, "fileId": storage_id })
                .await?;
            id
        }
        (Mode::Replace, None) => {
            return Err(AppError::not_found(format!("emoji {shortname} not found")));
        }
        (Mode::Replace, Some(existing)) => {
            let id = crate::doc::id(&existing);
            emojis
                .update_one(
                    doc! { "_id": id },
                    doc! { "$set": { "fileId": storage_id } },
                )
                .await?;
            if let Some(old) = existing.str("fileId").filter(|old| *old != storage_id)
                && emojis.count_documents(doc! { "fileId": old }).await? == 0
            {
                state.storage.remove(old).await?;
            }
            id
        }
    };
    emojis
        .find_one(doc! { "_id": id })
        .await?
        .ok_or_else(|| AppError::internal("emoji vanished"))
}
