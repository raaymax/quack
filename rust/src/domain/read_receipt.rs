use bson::oid::ObjectId;
use bson::{Bson, DateTime, Document, doc};
use futures::TryStreamExt;
use serde_json::{Map, Value, json};

use crate::doc::{DocExt, doc_to_json};
use crate::domain::channel;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

fn parent(parent_id: Option<ObjectId>) -> Bson {
    parent_id.map(Bson::ObjectId).unwrap_or(Bson::Null)
}

pub fn event(badge: &Document) -> Value {
    let Value::Object(fields) = doc_to_json(badge) else {
        unreachable!()
    };
    let mut map = Map::new();
    map.insert("type".into(), json!("readReceipt"));
    map.extend(fields);
    Value::Object(map)
}

pub async fn find(state: &AppState, filter: Document) -> AppResult<Vec<Document>> {
    Ok(state.db.badges().find(filter).await?.try_collect().await?)
}

async fn store_progress(
    state: &AppState,
    channel_id: ObjectId,
    parent_id: Option<ObjectId>,
    user_id: ObjectId,
    data: Document,
    last_read: DateTime,
) -> AppResult<Option<Document>> {
    let badges = state.db.badges();
    let key = doc! { "channelId": channel_id, "parentId": parent(parent_id), "userId": user_id };
    let progress = badges.find_one(key.clone()).await?;
    if let Some(progress) = &progress {
        if progress
            .get_datetime("lastRead")
            .is_ok_and(|read| *read > last_read)
        {
            return Ok(None);
        }
        badges
            .update_one(
                doc! { "_id": crate::doc::id(progress) },
                doc! { "$set": data },
            )
            .await?;
    } else {
        let mut badge = key.clone();
        badge.insert("_id", ObjectId::new());
        badge.extend(data);
        badges.insert_one(badge).await?;
    }
    Ok(badges.find_one(key).await?)
}

pub async fn on_message(state: &AppState, message: &Document, user_id: ObjectId) -> AppResult<()> {
    let Some(channel_id) = message.oid("channelId") else {
        return Ok(());
    };
    let Some(channel) = channel::get(state, channel_id).await? else {
        return Ok(());
    };
    let parent_id = message.oid("parentId");
    let message_id = crate::doc::id(message);
    let created_at = message
        .get_datetime("createdAt")
        .copied()
        .unwrap_or_else(|_| DateTime::now());

    let scope = doc! { "channelId": channel_id, "parentId": parent(parent_id) };
    state
        .db
        .badges()
        .update_many(scope.clone(), doc! { "$inc": { "count": 1 } })
        .await?;
    for badge in find(state, scope).await? {
        if let Some(owner) = badge.oid("userId").filter(|owner| *owner != user_id) {
            state.bus.direct(owner, event(&badge));
        }
    }

    let data = doc! { "lastMessageId": message_id, "lastRead": created_at, "count": 0 };
    if let Some(badge) =
        store_progress(state, channel_id, parent_id, user_id, data, created_at).await?
    {
        state
            .bus
            .group(channel::members(&channel), event(&badge), None);
    }
    Ok(())
}

pub async fn mark_read(
    state: &AppState,
    message_id: ObjectId,
    user_id: ObjectId,
) -> AppResult<Option<ObjectId>> {
    let message = state
        .db
        .messages()
        .find_one(doc! { "_id": message_id })
        .await?
        .ok_or_else(|| AppError::not_found("Message not found"))?;
    let channel_id = message
        .oid("channelId")
        .ok_or_else(|| AppError::not_found("Channel not found"))?;
    let parent_id = message.oid("parentId");
    let channel = channel::access(state, channel_id, user_id).await?;
    let created_at = message
        .get_datetime("createdAt")
        .copied()
        .unwrap_or_else(|_| DateTime::now());

    let mut newer = doc! {
        "channelId": channel_id,
        "createdAt": { "$gte": DateTime::from_millis(created_at.timestamp_millis() + 1) },
    };
    match parent_id {
        Some(p) => newer.insert("parentId", p),
        None => newer.insert("parentId", doc! { "$not": { "$ne": Bson::Null } }),
    };
    let count = state.db.messages().count_documents(newer).await?;

    let data = doc! { "lastMessageId": message_id, "lastRead": created_at, "count": count as i64 };
    let Some(badge) =
        store_progress(state, channel_id, parent_id, user_id, data, created_at).await?
    else {
        return Ok(None);
    };
    state
        .bus
        .group(channel::members(&channel), event(&badge), None);
    Ok(Some(crate::doc::id(&badge)))
}
