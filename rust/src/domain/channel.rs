use bson::oid::ObjectId;
use bson::{Document, doc};
use serde_json::{Map, Value, json};

use crate::doc::{DocExt, doc_to_json};
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub const PUBLIC: &str = "PUBLIC";
pub const PRIVATE: &str = "PRIVATE";
pub const DIRECT: &str = "DIRECT";

pub fn unique(ids: impl IntoIterator<Item = ObjectId>) -> Vec<ObjectId> {
    let mut out: Vec<ObjectId> = Vec::new();
    for id in ids {
        if !out.contains(&id) {
            out.push(id);
        }
    }
    out
}

pub fn members(channel: &Document) -> Vec<ObjectId> {
    channel.oid_list("users")
}

pub fn event(channel: &Document) -> Value {
    let Value::Object(fields) = doc_to_json(channel) else {
        unreachable!()
    };
    let mut map = Map::new();
    map.insert("type".into(), json!("channel"));
    map.extend(fields);
    Value::Object(map)
}

pub async fn get(state: &AppState, id: ObjectId) -> AppResult<Option<Document>> {
    Ok(state.db.channels().find_one(doc! { "_id": id }).await?)
}

pub async fn get_for_member(
    state: &AppState,
    id: ObjectId,
    user: ObjectId,
) -> AppResult<Option<Document>> {
    Ok(state
        .db
        .channels()
        .find_one(doc! { "_id": id, "users": { "$elemMatch": { "$eq": user } } })
        .await?)
}

pub async fn access(state: &AppState, id: ObjectId, user: ObjectId) -> AppResult<Document> {
    let channel = get(state, id)
        .await?
        .ok_or_else(|| AppError::not_found("Channel not found"))?;
    if channel.str("channelType") != Some(PUBLIC) && !members(&channel).contains(&user) {
        return Err(AppError::no_access("Access denied"));
    }
    Ok(channel)
}

pub async fn users_exist(state: &AppState, ids: &[ObjectId]) -> AppResult<()> {
    if ids.is_empty() {
        return Ok(());
    }
    let unique = unique(ids.iter().copied());
    let found = state
        .db
        .users()
        .count_documents(doc! { "_id": { "$in": &unique } })
        .await?;
    if found as usize != unique.len() {
        return Err(AppError::bad_request("INVALID_USER", "User not exist"));
    }
    Ok(())
}

pub async fn join(
    state: &AppState,
    channel_id: ObjectId,
    user_ids: &[ObjectId],
) -> AppResult<Option<ObjectId>> {
    if user_ids.is_empty() {
        return Ok(None);
    }
    users_exist(state, user_ids).await?;
    let channel = get(state, channel_id)
        .await?
        .ok_or_else(|| AppError::not_found("Channel not found"))?;
    let group = unique(
        members(&channel)
            .into_iter()
            .chain(user_ids.iter().copied()),
    );
    state
        .db
        .channels()
        .update_one(
            doc! { "_id": channel_id },
            doc! { "$set": { "users": &group } },
        )
        .await?;
    if let Some(updated) = get(state, channel_id).await? {
        state.bus.group(group, event(&updated), None);
    }
    Ok(Some(channel_id))
}

pub async fn find_direct(state: &AppState, users: &[ObjectId]) -> AppResult<Option<Document>> {
    Ok(state
        .db
        .channels()
        .find_one(
            doc! { "channelType": DIRECT, "users": { "$all": users, "$size": users.len() as i32 } },
        )
        .await?)
}

pub async fn put_direct(state: &AppState, users: &[ObjectId]) -> AppResult<ObjectId> {
    let users = unique(users.iter().copied());
    users_exist(state, &users).await?;
    if let Some(channel) = find_direct(state, &users).await? {
        return Ok(crate::doc::id(&channel));
    }
    let id = ObjectId::new();
    state
        .db
        .channels()
        .insert_one(doc! {
            "_id": id,
            "channelType": DIRECT,
            "users": &users,
            "private": true,
            "direct": true,
        })
        .await?;
    Ok(id)
}
