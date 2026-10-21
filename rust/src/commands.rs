use std::sync::Arc;

use async_trait::async_trait;
use bson::oid::ObjectId;
use bson::{DateTime, doc};
use serde_json::{Value, json};

use crate::doc::DocExt;
use crate::domain::channel;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub struct Invocation {
    pub user_id: ObjectId,
    pub text: String,
    pub channel_id: ObjectId,
    pub parent_id: Option<ObjectId>,
    pub app_version: Option<String>,
}

#[async_trait]
pub trait Command: Send + Sync {
    fn name(&self) -> &str;
    fn prompt(&self) -> &str {
        ""
    }
    fn description(&self) -> &str;
    async fn execute(&self, state: &AppState, call: &Invocation) -> AppResult<Value>;
}

pub type Commands = Vec<Arc<dyn Command>>;

pub fn builtin() -> Commands {
    vec![
        Arc::new(Version),
        Arc::new(Invite),
        Arc::new(Leave),
        Arc::new(Join),
        Arc::new(Main),
    ]
}

pub fn system_client_id() -> String {
    format!("sys:{}", rand::random::<u64>())
}

pub fn now_iso() -> String {
    crate::doc::iso(DateTime::now())
}

fn notice(call: &Invocation, text: &str) -> Value {
    json!({
        "type": "message",
        "clientId": system_client_id(),
        "channelId": call.channel_id.to_hex(),
        "flat": text,
        "message": { "text": text },
        "createdAt": now_iso(),
    })
}

pub async fn execute(state: &AppState, name: &str, call: Invocation) -> AppResult<Value> {
    if let Some(command) = state.commands.iter().find(|c| c.name() == name) {
        return command.execute(state, &call).await;
    }
    match name {
        "echo" => {
            state.bus.direct(call.user_id, notice(&call, &call.text));
            Ok(Value::Null)
        }
        "help" => {
            let names: Vec<String> = state
                .commands
                .iter()
                .map(|c| format!("/{}", c.name()))
                .collect();
            let items: Vec<Value> = state
                .commands
                .iter()
                .map(|c| {
                    let usage = if c.prompt().is_empty() {
                        format!("/{}", c.name())
                    } else {
                        format!("/{} {}", c.name(), c.prompt())
                    };
                    json!({ "item": [{ "code": usage }, { "text": " - " }, { "text": c.description() }] })
                })
                .collect();
            state.bus.direct(
                call.user_id,
                json!({
                    "type": "message",
                    "clientId": system_client_id(),
                    "channelId": call.channel_id.to_hex(),
                    "flat": format!("Available commands: {}", names.join(", ")),
                    "message": [{ "line": "Available commands:" }, { "bullet": items }],
                    "createdAt": now_iso(),
                }),
            );
            Ok(Value::Null)
        }
        _ => Err(AppError::not_found("command not found")),
    }
}

async fn system_user_id(state: &AppState) -> AppResult<Option<String>> {
    let user = state
        .db
        .users()
        .find_one(doc! { "$or": [{ "email": "system" }, { "name": "System" }] })
        .await?;
    Ok(user.map(|u| crate::doc::id(&u).to_hex()))
}

struct Version;

#[async_trait]
impl Command for Version {
    fn name(&self) -> &str {
        "version"
    }

    fn description(&self) -> &str {
        "Show the current version"
    }

    async fn execute(&self, state: &AppState, call: &Invocation) -> AppResult<Value> {
        let server = state
            .config
            .app_version
            .clone()
            .unwrap_or_else(|| "3.x.x".into());
        let client = call.app_version.clone().unwrap_or_else(|| "3.x.x".into());
        state.bus.direct(
            call.user_id,
            json!({
                "type": "message",
                "clientId": system_client_id(),
                "userId": system_user_id(state).await?,
                "ephemeral": true,
                "flat": format!("Server version: {server}\nClient version: {client}"),
                "message": [
                    { "line": [{ "text": "Server version: " }, { "bold": { "text": server } }] },
                    { "line": [{ "text": "Client version: " }, { "bold": { "text": client } }] },
                ],
                "channelId": call.channel_id.to_hex(),
                "createdAt": now_iso(),
            }),
        );
        Ok(Value::Null)
    }
}

struct Invite;

const INVITATION_TTL_MS: i64 = 1000 * 60 * 60 * 24 * 5;

#[async_trait]
impl Command for Invite {
    fn name(&self) -> &str {
        "invite"
    }

    fn description(&self) -> &str {
        "Generate an invitation link"
    }

    async fn execute(&self, state: &AppState, call: &Invocation) -> AppResult<Value> {
        let channel = channel::access(state, call.channel_id, call.user_id).await?;
        let invitations = state.db.invitations();
        invitations
            .delete_many(doc! { "expireAt": { "$lt": DateTime::now() } })
            .await?;
        let token = crate::auth::random_token(16);
        let now = DateTime::now();
        invitations
            .insert_one(doc! {
                "_id": ObjectId::new(),
                "token": &token,
                "userId": call.user_id,
                "channelId": call.channel_id,
                "expireAt": DateTime::from_millis(now.timestamp_millis() + INVITATION_TTL_MS),
                "createdAt": now,
            })
            .await?;
        let link = format!("{}/#/invite/{token}", state.config.base_url);
        let mut message = vec![
            json!({ "line": { "text": "Invitation link: " } }),
            json!({ "codeblock": link }),
            json!({ "line": { "text": "Link will be valid for 5 days" } }),
        ];
        if channel.str("channelType") != Some(channel::DIRECT) {
            message.push(
                json!({ "line": { "text": "User will be automatically added to this channel" } }),
            );
        }
        state.bus.direct(
            call.user_id,
            json!({
                "type": "message",
                "clientId": system_client_id(),
                "userId": system_user_id(state).await?,
                "ephemeral": true,
                "channelId": call.channel_id.to_hex(),
                "flat": format!("Invitation link (valid 5 days from now):\n{link}"),
                "message": message,
                "createdAt": now_iso(),
            }),
        );
        Ok(Value::String(link))
    }
}

struct Leave;

#[async_trait]
impl Command for Leave {
    fn name(&self) -> &str {
        "leave"
    }

    fn description(&self) -> &str {
        "Leave the current channel"
    }

    async fn execute(&self, state: &AppState, call: &Invocation) -> AppResult<Value> {
        let Some(mut found) = channel::get(state, call.channel_id).await? else {
            return Ok(Value::Null);
        };
        let previous = channel::members(&found);
        let remaining: Vec<ObjectId> = previous
            .iter()
            .copied()
            .filter(|u| *u != call.user_id)
            .collect();
        state
            .db
            .channels()
            .update_one(
                doc! { "_id": call.channel_id },
                doc! { "$set": { "users": &remaining } },
            )
            .await?;
        found.insert("users", remaining);
        state.bus.group(previous, channel::event(&found), None);
        state.bus.direct(
            call.user_id,
            json!({ "type": "removeChannel", "channelId": call.channel_id.to_hex() }),
        );
        state
            .bus
            .direct(call.user_id, notice(call, "You have left the channel"));
        Ok(Value::Null)
    }
}

struct Join;

#[async_trait]
impl Command for Join {
    fn name(&self) -> &str {
        "join"
    }

    fn description(&self) -> &str {
        "Join the current channel"
    }

    async fn execute(&self, state: &AppState, call: &Invocation) -> AppResult<Value> {
        channel::access(state, call.channel_id, call.user_id).await?;
        channel::join(state, call.channel_id, &[call.user_id]).await?;
        state
            .bus
            .direct(call.user_id, notice(call, "You have joined the channel"));
        Ok(Value::Null)
    }
}

struct Main;

#[async_trait]
impl Command for Main {
    fn name(&self) -> &str {
        "main"
    }

    fn description(&self) -> &str {
        "Sets current channel as main channel"
    }

    async fn execute(&self, state: &AppState, call: &Invocation) -> AppResult<Value> {
        if channel::get(state, call.channel_id).await?.is_none() {
            return Ok(Value::Null);
        }
        state
            .db
            .users()
            .update_one(
                doc! { "_id": call.user_id },
                doc! { "$set": { "mainChannelId": call.channel_id } },
            )
            .await?;
        Ok(Value::Null)
    }
}
