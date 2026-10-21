use std::convert::Infallible;
use std::time::Duration;

use axum::Router;
use axum::extract::State;
use axum::response::Response;
use axum::routing::get;
use bson::oid::ObjectId;
use bytes::Bytes;
use serde_json::{Value, json};
use tokio::sync::broadcast::error::RecvError;

use crate::auth::Auth;
use crate::doc::DocExt;
use crate::domain::channel;
use crate::sse;
use crate::state::AppState;

const HEARTBEAT: Duration = Duration::from_secs(30);
const KEEP_ALIVE: Duration = Duration::from_secs(3);

pub fn router() -> Router<AppState> {
    Router::new().route("/notifications", get(notifications))
}

async fn notifications(State(state): State<AppState>, auth: Auth) -> Response {
    let user = auth.user_id;
    let mut rx = state.bus.subscribe();
    let shutdown = state.shutdown.clone();
    let stream = async_stream::stream! {
        yield Ok::<Bytes, Infallible>(sse::frame(&json!({ "status": "connected" })));
        let mut heartbeat = tokio::time::interval(HEARTBEAT);
        let mut keep_alive = tokio::time::interval(KEEP_ALIVE);
        heartbeat.tick().await;
        keep_alive.tick().await;
        loop {
            tokio::select! {
                received = rx.recv() => match received {
                    Ok(envelope) => {
                        if !envelope.reaches(&user) {
                            continue;
                        }
                        if let Some(notification) = build(&state, &envelope.payload, user).await {
                            yield Ok(sse::frame(&notification));
                        }
                    }
                    Err(RecvError::Lagged(_)) => continue,
                    Err(RecvError::Closed) => break,
                },
                _ = heartbeat.tick() => yield Ok(sse::frame(&json!({ "type": "ping" }))),
                _ = keep_alive.tick() => yield Ok(Bytes::from_static(b":keep-alive\n\n")),
                _ = shutdown.cancelled() => break,
            }
        }
    };
    sse::response(stream)
}

async fn build(state: &AppState, msg: &Value, user: ObjectId) -> Option<Value> {
    if msg.get("type").and_then(Value::as_str) != Some("message") {
        return None;
    }
    let sender_id = msg
        .get("userId")
        .and_then(Value::as_str)
        .unwrap_or_default();
    if sender_id == user.to_hex() {
        return None;
    }
    let channel_id = msg.get("channelId").and_then(Value::as_str);
    let channel_name = match channel_id.and_then(|c| ObjectId::parse_str(c).ok()) {
        Some(id) => channel::get(state, id)
            .await
            .ok()
            .flatten()
            .and_then(|c| c.str("name").map(str::to_owned)),
        None => None,
    };
    let sender_name = match ObjectId::parse_str(sender_id) {
        Ok(id) => state
            .db
            .users()
            .find_one(bson::doc! { "_id": id })
            .await
            .ok()
            .flatten()
            .and_then(|u| u.str("name").map(str::to_owned)),
        Err(_) => None,
    };
    let title = match (&sender_name, &channel_name) {
        (Some(sender), Some(channel)) => format!("{sender} in #{channel}"),
        (Some(sender), None) => sender.clone(),
        (None, Some(channel)) => format!("#{channel}"),
        (None, None) => "New message".into(),
    };
    Some(json!({
        "type": "notification",
        "channelId": channel_id,
        "parentId": msg.get("parentId").and_then(Value::as_str),
        "title": title,
        "body": msg.get("flat").and_then(Value::as_str).unwrap_or_default(),
        "senderId": sender_id,
        "senderName": sender_name.unwrap_or_default(),
    }))
}
