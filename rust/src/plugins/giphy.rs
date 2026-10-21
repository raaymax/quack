use std::sync::Arc;

use async_trait::async_trait;
use bson::oid::ObjectId;
use serde_json::{Value, json};
use tokio::sync::broadcast::error::RecvError;

use crate::commands::{Command, Invocation, now_iso};
use crate::domain::message::{self, NewMessage};
use crate::error::{AppError, AppResult};
use crate::events::DomainEvent;
use crate::state::AppState;

const APP_ID: &str = "giphy";

pub struct Giphy {
    api_key: String,
    client: reqwest::Client,
}

struct Location {
    user_id: ObjectId,
    client_id: String,
    channel_id: String,
}

impl Giphy {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: reqwest::Client::new(),
        }
    }

    pub fn listen(self: Arc<Self>, state: AppState) {
        let mut rx = state.events.subscribe();
        tokio::spawn(async move {
            loop {
                match rx.recv().await {
                    Ok(DomainEvent::MessageInteraction(interaction)) => {
                        if let Err(e) = self.interact(&state, &interaction).await {
                            tracing::warn!(error = ?e, "giphy interaction failed");
                        }
                    }
                    Ok(_) => {}
                    Err(RecvError::Lagged(_)) => {}
                    Err(RecvError::Closed) => break,
                }
            }
        });
    }

    async fn interact(&self, state: &AppState, interaction: &Value) -> AppResult<()> {
        let field = |key: &str| {
            interaction
                .get(key)
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_owned()
        };
        let Ok(user_id) = ObjectId::parse_str(field("userId")) else {
            return Ok(());
        };
        let location = Location {
            user_id,
            client_id: field("clientId"),
            channel_id: field("channelId"),
        };
        let payload = interaction.get("payload").cloned().unwrap_or(Value::Null);
        match field("action").as_str() {
            "giphy:send" => self.send(state, &location, interaction, &payload).await,
            "giphy:next" => {
                let count = payload["count"].as_i64().unwrap_or(1).max(1);
                let idx = (payload["idx"].as_i64().unwrap_or(0) + 1) % count;
                show(state, &location, select(&payload, idx));
                Ok(())
            }
            "giphy:prev" => {
                let count = payload["count"].as_i64().unwrap_or(1).max(1);
                let mut idx = payload["idx"].as_i64().unwrap_or(0) - 1;
                if idx < 0 {
                    idx += count;
                }
                show(state, &location, select(&payload, idx));
                Ok(())
            }
            "giphy:close" => {
                remove_preview(state, &location);
                Ok(())
            }
            _ => Ok(()),
        }
    }

    async fn send(
        &self,
        state: &AppState,
        location: &Location,
        interaction: &Value,
        payload: &Value,
    ) -> AppResult<()> {
        remove_preview(state, location);
        let channel_id = crate::doc::oid(&location.channel_id)?;
        let parent_id = interaction
            .get("parentId")
            .and_then(Value::as_str)
            .map(crate::doc::oid)
            .transpose()?;
        let text = payload["text"].as_str().unwrap_or_default();
        let body = json!([
            { "line": [{ "text": "/giphy " }, { "text": text }] },
            { "line": { "img": payload["imageUrl"], "_alt": payload["title"] } },
        ]);
        let new = NewMessage {
            message: Some(body),
            parent_id,
            ..Default::default()
        };
        message::create(state, location.user_id, channel_id, new).await?;
        Ok(())
    }
}

fn select(payload: &Value, idx: i64) -> Value {
    let mut next = payload.clone();
    if let (Value::Object(map), Some(Value::Object(image))) =
        (&mut next, payload["images"].get(idx as usize))
    {
        map.extend(image.clone());
        map.insert("idx".into(), json!(idx));
    }
    next
}

fn remove_preview(state: &AppState, location: &Location) {
    state.bus.direct(
        location.user_id,
        json!({
            "type": "message:remove",
            "clientId": location.client_id,
            "appId": APP_ID,
            "channelId": location.channel_id,
        }),
    );
}

fn show(state: &AppState, location: &Location, payload: Value) {
    let position = payload["idx"].as_i64().unwrap_or(0) + 1;
    let count = payload["count"].as_i64().unwrap_or(0);
    state.bus.direct(
        location.user_id,
        json!({
            "type": "message",
            "appId": APP_ID,
            "clientId": location.client_id,
            "ephemeral": true,
            "channelId": location.channel_id,
            "flat": "Giphy search results",
            "message": [
                { "line": [{ "text": format!("Giphy search results: {position} / {count}") }] },
                { "line": { "img": payload["imageUrl"], "_alt": payload["title"] } },
                { "line": [
                    { "button": "Send", "_action": "giphy:send", "_payload": payload },
                    { "button": "Next", "_action": "giphy:next", "_payload": payload },
                    { "button": "Previous", "_action": "giphy:prev", "_payload": payload },
                    { "button": "Cancel", "_action": "giphy:close" },
                ]},
            ],
            "createdAt": now_iso(),
        }),
    );
}

#[async_trait]
impl Command for Giphy {
    fn name(&self) -> &str {
        "giphy"
    }

    fn prompt(&self) -> &str {
        "search term"
    }

    fn description(&self) -> &str {
        "Search for a gif on Giphy"
    }

    async fn execute(&self, state: &AppState, call: &Invocation) -> AppResult<Value> {
        let results: Value = self
            .client
            .get("https://api.giphy.com/v1/gifs/search")
            .query(&[
                ("api_key", self.api_key.as_str()),
                ("q", call.text.as_str()),
                ("limit", "25"),
                ("offset", "0"),
                ("rating", "g"),
                ("lang", "en"),
                ("bundle", "messaging_non_clips"),
            ])
            .send()
            .await
            .and_then(reqwest::Response::error_for_status)
            .map_err(|e| AppError::internal(format!("giphy request failed: {e}")))?
            .json()
            .await
            .map_err(|e| AppError::internal(format!("giphy response invalid: {e}")))?;
        let images: Vec<Value> = results["data"]
            .as_array()
            .map(|items| {
                items
                    .iter()
                    .map(|r| json!({ "imageUrl": r["images"]["fixed_height"]["url"], "title": r["title"] }))
                    .collect()
            })
            .unwrap_or_default();
        let mut payload = json!({
            "text": call.text,
            "idx": 0,
            "count": results["pagination"]["count"],
            "images": images,
        });
        if let (Value::Object(map), Some(Value::Object(first))) = (&mut payload, images.first()) {
            map.extend(first.clone());
        }
        let location = Location {
            user_id: call.user_id,
            client_id: format!("{APP_ID}:{}", rand::random::<u64>()),
            channel_id: call.channel_id.to_hex(),
        };
        show(state, &location, payload);
        Ok(Value::Null)
    }
}
