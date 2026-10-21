use axum::extract::State;
use axum::response::Response;
use axum::routing::get;
use axum::{Json, Router};
use serde_json::{Value, json};

use crate::auth::Auth;
use crate::sse;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/ping", get(ping))
        .route("/sse", get(events))
}

async fn ping() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

async fn events(State(state): State<AppState>, auth: Auth) -> Response {
    let user = auth.user_id;
    sse::response(sse::events(
        &state.bus,
        state.shutdown.clone(),
        json!({ "status": "connected" }),
        move |envelope| envelope.reaches(&user).then(|| (*envelope.payload).clone()),
    ))
}
