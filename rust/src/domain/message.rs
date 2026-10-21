use std::collections::HashMap;

use bson::oid::ObjectId;
use bson::{Bson, DateTime, Document, doc};
use serde_json::{Map, Value, json};

use crate::doc::{DocExt, doc_to_json, from_json};
use crate::domain::{channel, file, read_receipt};
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn flatten(tree: &Value) -> String {
    let mut out = String::new();
    flatten_into(tree, &mut out);
    out
}

fn flatten_into(tree: &Value, out: &mut String) {
    let nodes: Vec<&Value> = match tree {
        Value::Array(items) => items.iter().collect(),
        other => vec![other],
    };
    for node in nodes {
        let Value::Object(n) = node else {
            if let Value::Array(_) = node {
                flatten_into(node, out);
            }
            continue;
        };
        let text = |key: &str| {
            n.get(key)
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_owned()
        };
        if let Some(child) = ["blockquote", "bold"].iter().find_map(|k| n.get(*k)) {
            flatten_into(child, out);
        } else if n.contains_key("br") {
            out.push('\n');
        } else if let Some(child) = n.get("bullet") {
            flatten_into(child, out);
        } else if n.contains_key("channel") {
            out.push_str(&text("channel"));
        } else if n.contains_key("code") {
            out.push_str(&text("code"));
        } else if n.contains_key("codeblock") {
            out.push_str(&text("codeblock"));
        } else if n.contains_key("emoji") {
            out.push_str(&text("emoji"));
        } else if n.contains_key("img") {
            out.push_str(&text("_alt"));
        } else if let Some(child) = ["italic", "item"].iter().find_map(|k| n.get(*k)) {
            flatten_into(child, out);
        } else if let Some(child) = n.get("line") {
            flatten_into(child, out);
            out.push('\n');
        } else if let Some(child) = ["link", "ordered", "strike"].iter().find_map(|k| n.get(*k)) {
            flatten_into(child, out);
        } else if n.contains_key("text") {
            out.push_str(&text("text"));
        } else if n.contains_key("thread") {
            out.push_str(&text("thread"));
        } else if let Some(child) = n.get("underline") {
            flatten_into(child, out);
        } else if n.contains_key("user") {
            out.push_str(&text("user"));
        }
    }
}

pub fn valid_body(value: &Value) -> bool {
    match value {
        Value::Array(items) => items.iter().all(valid_body),
        Value::Object(node) => {
            let s = |k: &str| node.get(k).is_some_and(Value::is_string);
            let id = |k: &str| {
                node.get(k)
                    .and_then(Value::as_str)
                    .is_some_and(crate::doc::is_entity_id)
            };
            let body = |k: &str| node.get(k).is_some_and(valid_body);
            let opt_s = |k: &str| node.get(k).is_none_or(Value::is_string);
            let rules = [
                body("bullet"),
                body("ordered"),
                body("item"),
                s("codeblock"),
                body("blockquote"),
                s("code"),
                body("line"),
                node.get("br").is_some_and(Value::is_boolean),
                s("text"),
                body("bold"),
                body("italic"),
                body("underline"),
                body("strike"),
                s("img") && opt_s("_alt"),
                body("link") && s("_href"),
                s("emoji"),
                id("channel"),
                id("user"),
                s("thread") && id("_channelId") && id("_parentId"),
                s("encrypted") && s("_iv"),
            ];
            rules.iter().filter(|r| **r).count() == 1
        }
        _ => false,
    }
}

pub fn to_json(message: &Document, files: &HashMap<ObjectId, Vec<Value>>) -> Value {
    let mut value = doc_to_json(message);
    if let (Value::Object(map), Some(list)) = (&mut value, files.get(&crate::doc::id(message))) {
        map.insert("files".into(), Value::Array(list.clone()));
    }
    value
}

pub fn event(message: &Value) -> Value {
    let mut map = Map::new();
    map.insert("type".into(), json!("message"));
    if let Value::Object(fields) = message {
        map.extend(fields.clone());
    }
    Value::Object(map)
}

pub async fn get(state: &AppState, id: ObjectId) -> AppResult<Option<Document>> {
    Ok(state.db.messages().find_one(doc! { "_id": id }).await?)
}

pub async fn with_files(state: &AppState, message: &Document) -> AppResult<Value> {
    let files = file::resolve(state, std::slice::from_ref(message)).await?;
    Ok(to_json(message, &files))
}

pub async fn get_visible(state: &AppState, id: ObjectId, user: ObjectId) -> AppResult<Value> {
    let message = get(state, id)
        .await?
        .ok_or_else(|| AppError::not_found("Message not found"))?;
    let channel_id = message
        .oid("channelId")
        .ok_or_else(|| AppError::not_found("Channel not found"))?;
    channel::access(state, channel_id, user).await?;
    with_files(state, &message).await
}

#[derive(Default)]
pub struct NewMessage {
    pub message: Option<Value>,
    pub flat: Option<String>,
    pub encrypted: Option<String>,
    pub iv: Option<String>,
    pub parent_id: Option<ObjectId>,
    pub client_id: Option<String>,
    pub emoji_only: bool,
    pub pinned: Option<bool>,
    pub links: Vec<String>,
    pub mentions: Vec<ObjectId>,
    pub file_ids: Vec<ObjectId>,
}

pub async fn create(
    state: &AppState,
    user_id: ObjectId,
    channel_id: ObjectId,
    mut msg: NewMessage,
) -> AppResult<ObjectId> {
    let channel = channel::access(state, channel_id, user_id).await?;
    let has_message = msg.message.as_ref().is_some_and(|m| !m.is_null());
    let has_flat = msg.flat.as_ref().is_some_and(|f| !f.is_empty());
    let has_encrypted = msg.encrypted.as_ref().is_some_and(|e| !e.is_empty());
    if !has_message && !has_flat && !has_encrypted {
        return Err(AppError::bad_request(
            "INVALID_MESSAGE",
            "Message or flat must be provided",
        ));
    }
    if has_encrypted && msg.iv.as_ref().is_none_or(|iv| iv.is_empty()) {
        return Err(AppError::bad_request(
            "INVALID_MESSAGE",
            "IV must be provided when message is encrypted",
        ));
    }
    if !has_message && has_flat {
        msg.message = Some(json!({ "text": msg.flat }));
    }
    if !has_flat && let Some(body) = msg.message.as_ref().filter(|_| has_message) {
        msg.flat = Some(flatten(body));
    }
    let client_id = msg
        .client_id
        .clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    let mut data = Document::new();
    if let Some(encrypted) = &msg.encrypted {
        data.insert("encrypted", encrypted);
    }
    if let Some(iv) = &msg.iv {
        data.insert("_iv", iv);
    }
    data.insert("secured", has_encrypted);
    if let Some(body) = &msg.message {
        data.insert("message", from_json(body));
    }
    data.insert("flat", msg.flat.clone().unwrap_or_default());
    if let Some(pinned) = msg.pinned {
        data.insert("pinned", pinned);
    }
    data.insert("channelId", channel_id);
    if let Some(parent_id) = msg.parent_id {
        data.insert("parentId", parent_id);
    }
    if let Some(cid) = channel.get("cid") {
        data.insert("channel", cid.clone());
    }
    data.insert("clientId", &client_id);
    data.insert("emojiOnly", msg.emoji_only);
    data.insert("userId", user_id);
    data.insert("links", &msg.links);
    data.insert("mentions", &msg.mentions);
    if !msg.file_ids.is_empty() {
        data.insert("fileIds", &msg.file_ids);
    }
    data.insert("createdAt", DateTime::now());

    let messages = state.db.messages();
    let existing = messages
        .find_one(doc! { "channelId": channel_id, "userId": user_id, "clientId": &client_id })
        .await?;
    let id = match existing {
        Some(existing) => {
            let id = crate::doc::id(&existing);
            messages
                .update_one(doc! { "_id": id }, doc! { "$set": data })
                .await?;
            id
        }
        None => {
            let id = ObjectId::new();
            data.insert("_id", id);
            messages.insert_one(data).await?;
            id
        }
    };

    let members = channel::members(&channel);
    let joining: Vec<ObjectId> = msg
        .mentions
        .iter()
        .copied()
        .filter(|m| !members.contains(m))
        .collect();
    channel::join(state, channel_id, &joining).await?;

    let created = get(state, id)
        .await?
        .ok_or_else(|| AppError::internal("message vanished"))?;
    file::attach_to_message(state, &msg.file_ids, &created, user_id).await?;

    if let Some(parent_id) = msg.parent_id {
        messages
            .update_one(
                doc! { "_id": parent_id },
                doc! {
                    "$push": { "thread": { "userId": user_id, "childId": id } },
                    "$set": { "updatedAt": DateTime::now() },
                },
            )
            .await?;
        if let Some(parent) = get(state, parent_id).await? {
            state
                .bus
                .group(members.clone(), event(&doc_to_json(&parent)), None);
        }
    }

    let json = with_files(state, &created).await?;
    state.bus.group(members, event(&json), None);
    read_receipt::on_message(state, &created, user_id).await?;
    state.events.message_created(json);
    Ok(id)
}

pub fn parent_filter(parent_id: Option<ObjectId>) -> Bson {
    match parent_id {
        Some(id) => Bson::ObjectId(id),
        None => Bson::Document(doc! { "$not": { "$ne": Bson::Null } }),
    }
}
