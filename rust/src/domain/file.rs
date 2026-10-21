use std::collections::HashMap;

use bson::oid::ObjectId;
use bson::{Bson, DateTime, Document, doc};
use futures::TryStreamExt;
use serde_json::{Map, Value, json};

use crate::doc::{DocExt, doc_to_json};
use crate::domain::channel;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub const DRAFT: &str = "draft";
pub const ATTACHED: &str = "attached";
pub const DELETED: &str = "deleted";

pub fn client_file(file: &Document) -> Value {
    let mut file = file.clone();
    file.remove("storageId");
    doc_to_json(&file)
}

pub fn event(file: &Document) -> Value {
    let Value::Object(fields) = client_file(file) else {
        unreachable!()
    };
    let mut map = Map::new();
    map.insert("type".into(), json!("file"));
    map.extend(fields);
    Value::Object(map)
}

pub async fn get(state: &AppState, id: ObjectId) -> AppResult<Option<Document>> {
    Ok(state.db.files().find_one(doc! { "_id": id }).await?)
}

pub async fn resolve(
    state: &AppState,
    messages: &[Document],
) -> AppResult<HashMap<ObjectId, Vec<Value>>> {
    let ids: Vec<ObjectId> = messages
        .iter()
        .flat_map(|m| m.oid_list("fileIds"))
        .collect();
    if ids.is_empty() {
        return Ok(HashMap::new());
    }
    let files: Vec<Document> = state
        .db
        .files()
        .find(doc! { "_id": { "$in": &ids } })
        .await?
        .try_collect()
        .await?;
    let by_id: HashMap<ObjectId, &Document> =
        files.iter().map(|f| (crate::doc::id(f), f)).collect();
    let mut out = HashMap::new();
    for message in messages {
        let file_ids = message.oid_list("fileIds");
        if file_ids.is_empty() {
            continue;
        }
        let resolved = file_ids
            .iter()
            .filter_map(|id| by_id.get(id))
            .filter(|f| f.str("status") != Some(DELETED))
            .map(|f| client_file(f))
            .collect();
        out.insert(crate::doc::id(message), resolved);
    }
    Ok(out)
}

pub async fn register(
    state: &AppState,
    channel_id: ObjectId,
    user_id: ObjectId,
    storage_id: &str,
    meta: &crate::storage::FileMeta,
    size: Option<u64>,
) -> AppResult<ObjectId> {
    let id = ObjectId::new();
    let resolution = match &meta.resolution {
        Some(r) => Bson::Document(doc! { "width": r.width as i64, "height": r.height as i64 }),
        None => Bson::Null,
    };
    state
        .db
        .files()
        .insert_one(doc! {
            "_id": id,
            "storageId": storage_id,
            "channelId": channel_id,
            "userId": user_id,
            "fileName": &meta.filename,
            "contentType": &meta.content_type,
            "size": size.map(|s| Bson::Int64(s as i64)).unwrap_or(Bson::Null),
            "resolution": resolution,
            "status": DRAFT,
            "messageId": Bson::Null,
            "createdAt": DateTime::now(),
        })
        .await?;
    Ok(id)
}

pub async fn attach_to_message(
    state: &AppState,
    file_ids: &[ObjectId],
    message: &Document,
    user_id: ObjectId,
) -> AppResult<()> {
    if file_ids.is_empty() {
        return Ok(());
    }
    let message_id = crate::doc::id(message);
    let Some(channel_id) = message.oid("channelId") else {
        return Ok(());
    };
    let Some(channel) = channel::get(state, channel_id).await? else {
        return Ok(());
    };
    let created_at = message
        .get_datetime("createdAt")
        .copied()
        .unwrap_or_else(|_| DateTime::now());
    for file_id in file_ids {
        let Some(file) = get(state, *file_id).await? else {
            continue;
        };
        if file.oid("channelId") != Some(channel_id) || file.oid("userId") != Some(user_id) {
            continue;
        }
        if file.str("status") != Some(DRAFT) {
            continue;
        }
        state
            .db
            .files()
            .update_one(
                doc! { "_id": file_id },
                doc! { "$set": { "status": ATTACHED, "messageId": message_id, "createdAt": created_at } },
            )
            .await?;
        if let Some(updated) = get(state, *file_id).await? {
            state
                .bus
                .group(channel::members(&channel), event(&updated), None);
        }
    }
    Ok(())
}

pub async fn attach_to_channel(
    state: &AppState,
    file_id: ObjectId,
    channel_id: ObjectId,
    user_id: ObjectId,
) -> AppResult<()> {
    let channel = channel::access(state, channel_id, user_id).await?;
    let file = get(state, file_id)
        .await?
        .filter(|f| f.oid("channelId") == Some(channel_id))
        .ok_or_else(|| AppError::not_found("File not found"))?;
    if file.oid("userId") != Some(user_id) {
        return Err(AppError::not_owner("Not owner"));
    }
    match file.str("status") {
        Some(ATTACHED) => return Ok(()),
        Some(DRAFT) => {}
        _ => return Err(AppError::not_found("File not found")),
    }
    state
        .db
        .files()
        .update_one(
            doc! { "_id": file_id },
            doc! { "$set": { "status": ATTACHED } },
        )
        .await?;
    if let Some(updated) = get(state, file_id).await? {
        state
            .bus
            .group(channel::members(&channel), event(&updated), None);
    }
    Ok(())
}

async fn release_blob(state: &AppState, storage_id: &str) -> AppResult<()> {
    let referenced = state
        .db
        .files()
        .count_documents(doc! { "storageId": storage_id, "status": ATTACHED })
        .await?;
    if referenced == 0 {
        state.storage.remove(storage_id).await?;
    }
    Ok(())
}

pub async fn remove(state: &AppState, file_id: ObjectId, user_id: ObjectId) -> AppResult<()> {
    let file = get(state, file_id)
        .await?
        .ok_or_else(|| AppError::not_found("File not found"))?;
    if file.oid("userId") != Some(user_id) {
        return Err(AppError::not_owner("Not owner"));
    }
    state
        .db
        .files()
        .update_one(
            doc! { "_id": file_id },
            doc! { "$set": { "status": DELETED, "messageId": Bson::Null } },
        )
        .await?;
    if let Some(storage_id) = file.str("storageId") {
        release_blob(state, storage_id).await?;
    }
    let users = match file.oid("channelId") {
        Some(channel_id) => channel::get(state, channel_id)
            .await?
            .map(|c| channel::members(&c))
            .unwrap_or_default(),
        None => Vec::new(),
    };
    state.bus.group(
        users,
        json!({
            "type": "file:removed",
            "id": file_id.to_hex(),
            "channelId": file.oid("channelId").map(|c| c.to_hex()),
        }),
        None,
    );
    Ok(())
}

pub async fn remove_stale_drafts(state: &AppState, max_age_ms: i64) -> AppResult<()> {
    let cutoff = DateTime::from_millis(DateTime::now().timestamp_millis() - max_age_ms);
    let drafts: Vec<Document> = state
        .db
        .files()
        .find(doc! { "status": DRAFT, "createdAt": { "$lt": cutoff } })
        .await?
        .try_collect()
        .await?;
    for file in drafts {
        if let Some(storage_id) = file.str("storageId") {
            release_blob(state, storage_id).await?;
        }
        state
            .db
            .files()
            .delete_one(doc! { "_id": crate::doc::id(&file) })
            .await?;
    }
    Ok(())
}
