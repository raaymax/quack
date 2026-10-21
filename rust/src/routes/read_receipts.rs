use axum::extract::{Path, State};
use axum::routing::get;
use axum::{Json, Router};
use bson::{Bson, doc};
use serde::Deserialize;
use serde_json::{Value, json};

use crate::auth::Auth;
use crate::doc::{docs_to_json, oid};
use crate::domain::{channel, read_receipt};
use crate::error::AppResult;
use crate::extract::Body;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(own).post(mark))
}

pub fn channel_router() -> Router<AppState> {
    Router::new().route("/", get(for_channel))
}

async fn own(State(state): State<AppState>, auth: Auth) -> AppResult<Json<Value>> {
    let badges = read_receipt::find(&state, doc! { "userId": auth.user_id }).await?;
    Ok(Json(docs_to_json(&badges)))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Mark {
    message_id: String,
}

crate::required!(Mark, "messageId");

async fn mark(
    State(state): State<AppState>,
    auth: Auth,
    Body(body): Body<Mark>,
) -> AppResult<Json<Value>> {
    let id = read_receipt::mark_read(&state, oid(&body.message_id)?, auth.user_id).await?;
    Ok(Json(match id {
        Some(id) => json!({ "id": id.to_hex() }),
        None => json!({}),
    }))
}

async fn for_channel(
    State(state): State<AppState>,
    auth: Auth,
    Path(channel_id): Path<String>,
) -> AppResult<Json<Value>> {
    let channel_id = oid(&channel_id)?;
    channel::access(&state, channel_id, auth.user_id).await?;
    let badges = read_receipt::find(
        &state,
        doc! { "channelId": channel_id, "parentId": Bson::Null },
    )
    .await?;
    Ok(Json(docs_to_json(&badges)))
}
