use axum::body::Body as RawBody;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, patch, put};
use axum::{Json, Router};
use bson::{Document, doc};
use serde::Deserialize;
use serde_json::{Value, json};

use crate::auth::Auth;
use crate::doc::DocExt;
use crate::error::{AppError, AppResult};
use crate::extract::Body;
use crate::routes::upload;
use crate::routes::users::serialize_user;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/config", get(config))
        .route("/", patch(update))
        .route("/avatar", put(avatar))
}

async fn config(State(state): State<AppState>, auth: Auth) -> AppResult<Json<Value>> {
    let main_channel_id = match auth.user.oid("mainChannelId") {
        Some(id) => Some(id),
        None => state
            .db
            .channels()
            .find_one(doc! { "cid": auth.user_id.to_hex() })
            .await?
            .map(|c| crate::doc::id(&c)),
    };
    let mut body = json!({ "mainChannelId": main_channel_id.map(|id| id.to_hex()) });
    if let Some(version) = &state.config.app_version {
        body["appVersion"] = json!(version);
    }
    Ok(Json(body))
}

fn broadcast_user(state: &AppState, user: &Document) {
    state.bus.broadcast(json!({
        "type": "user",
        "id": crate::doc::id(user).to_hex(),
        "name": user.str("name"),
        "avatarFileId": user.str("avatarFileId"),
    }));
}

async fn reload(state: &AppState, auth: &Auth) -> AppResult<Document> {
    state
        .db
        .users()
        .find_one(doc! { "_id": auth.user_id })
        .await?
        .ok_or_else(|| AppError::not_found("User not found"))
}

#[derive(Deserialize)]
struct UpdateProfile {
    name: Value,
}

crate::required!(UpdateProfile, "name");

async fn update(
    State(state): State<AppState>,
    auth: Auth,
    Body(body): Body<UpdateProfile>,
) -> AppResult<Response> {
    let name = match &body.name {
        Value::String(s) => s.trim().to_owned(),
        Value::Null => String::new(),
        other => other.to_string(),
    };
    if name.is_empty() {
        let body = json!({ "errorCode": "INVALID_NAME", "message": "name cannot be empty" });
        return Ok((StatusCode::BAD_REQUEST, Json(body)).into_response());
    }
    if name.chars().count() > 120 {
        let body = json!({ "errorCode": "INVALID_NAME", "message": "name is too long" });
        return Ok((StatusCode::BAD_REQUEST, Json(body)).into_response());
    }
    state
        .db
        .users()
        .update_one(
            doc! { "_id": auth.user_id },
            doc! { "$set": { "name": &name } },
        )
        .await?;
    let user = reload(&state, &auth).await?;
    broadcast_user(&state, &user);
    Ok(Json(json!({ "status": "ok", "user": serialize_user(&user) })).into_response())
}

async fn avatar(
    State(state): State<AppState>,
    auth: Auth,
    headers: HeaderMap,
    body: RawBody,
) -> AppResult<Response> {
    let opts = upload::opts(&headers, "avatar");
    if !opts.content_type.starts_with("image/") {
        let body = json!({ "errorCode": "INVALID_AVATAR", "message": "expected an image" });
        return Ok((StatusCode::BAD_REQUEST, Json(body)).into_response());
    }
    let (storage_id, _) = state.storage.upload(upload::stream(body), opts).await?;
    let previous = auth.user.str("avatarFileId").map(str::to_owned);
    let result = state
        .db
        .users()
        .update_one(
            doc! { "_id": auth.user_id },
            doc! { "$set": { "avatarFileId": &storage_id } },
        )
        .await;
    if let Err(e) = result {
        let _ = state.storage.remove(&storage_id).await;
        return Err(e.into());
    }
    if let Some(old) = previous.filter(|old| *old != storage_id) {
        let _ = state.storage.remove(&old).await;
    }
    let user = reload(&state, &auth).await?;
    broadcast_user(&state, &user);
    Ok(Json(json!({ "status": "ok", "user": serialize_user(&user) })).into_response())
}
