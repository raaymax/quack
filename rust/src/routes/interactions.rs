use axum::Router;
use axum::extract::State;
use axum::http::StatusCode;
use axum::routing::post;
use serde::Deserialize;
use serde_json::{Value, json};

use crate::auth::Auth;
use crate::doc::oid;
use crate::error::AppResult;
use crate::extract::Body;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", post(interact))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Interaction {
    channel_id: String,
    client_id: String,
    action: String,
    parent_id: Option<String>,
    app_id: Option<String>,
    payload: Option<Value>,
}

crate::required!(Interaction, "channelId", "clientId", "action");

async fn interact(
    State(state): State<AppState>,
    auth: Auth,
    Body(body): Body<Interaction>,
) -> AppResult<StatusCode> {
    oid(&body.channel_id)?;
    if let Some(parent) = &body.parent_id {
        oid(parent)?;
    }
    state.events.interaction(json!({
        "userId": auth.user_id.to_hex(),
        "channelId": body.channel_id,
        "clientId": body.client_id,
        "action": body.action,
        "parentId": body.parent_id,
        "appId": body.app_id,
        "payload": body.payload,
    }));
    Ok(StatusCode::NO_CONTENT)
}
