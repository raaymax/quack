use std::time::Duration;

use bson::oid::ObjectId;
use bson::{DateTime, Document, doc};
use futures::TryStreamExt;
use mongodb::IndexModel;
use mongodb::options::IndexOptions;

use crate::db::Db;

const LEGACY: [&str; 22] = [
    "20220509210354-create-default-users.ts",
    "20220509210445-create-default-channel.ts",
    "20220510184710-remvoe-sessions.ts",
    "20220615085243-alter-messages-users.ts",
    "20220626150314-alter-messages-add-unique-index.ts",
    "20220626150423-alter-channels-add-unique-index.ts",
    "20220803152709-alter-messages-search-index.ts",
    "20221212102914-alter-messages-add-channelId.ts",
    "20221214094851-add-system-users.ts",
    "20221214120750-remove-channel-cid-index.ts",
    "20230427120750-set-null-in-messages-parent-id.ts",
    "20230523120750-fix-user-id-in-messages.ts",
    "20230605230300-mark-system-users.ts",
    "20230610000400-fill-channel-type.ts",
    "20231216153127-fill-missing-channel-fields.ts",
    "20240923220603-add_alias_for_system_user.ts",
    "20241201171000-message-format-change.ts",
    "20241212231300-alter-users-add-email-index.ts",
    "20241221120000-alter-users-change-login-to-email.ts",
    "20250104160200_alter_read_receipts_add_unique_index.ts",
    "20260616120000_sessions_add_expiry_and_token_index.ts",
    "20260617120000_create_files_and_backfill.ts",
];

fn index(keys: Document, options: Option<IndexOptions>) -> IndexModel {
    IndexModel::builder().keys(keys).options(options).build()
}

fn unique() -> Option<IndexOptions> {
    Some(IndexOptions::builder().unique(true).build())
}

async fn baseline(db: &Db) -> anyhow::Result<()> {
    db.users()
        .create_index(index(doc! { "email": 1 }, unique()))
        .await?;
    db.sessions()
        .create_index(index(
            doc! { "expires": 1 },
            Some(IndexOptions::builder().expire_after(Duration::ZERO).build()),
        ))
        .await?;
    db.sessions()
        .create_index(index(doc! { "token": 1 }, unique()))
        .await?;
    db.messages()
        .create_index(index(doc! { "clientId": 1 }, unique()))
        .await?;
    db.messages()
        .create_index(index(doc! { "flat": "text" }, None))
        .await?;
    db.badges()
        .create_index(index(
            doc! { "userId": 1, "channelId": 1, "parentId": 1 },
            unique(),
        ))
        .await?;
    db.files()
        .create_index(index(doc! { "messageId": 1, "storageId": 1 }, unique()))
        .await?;
    db.files()
        .create_index(index(
            doc! { "channelId": 1, "status": 1, "createdAt": -1 },
            None,
        ))
        .await?;
    db.files()
        .create_index(index(doc! { "storageId": 1, "status": 1 }, None))
        .await?;

    db.users()
        .insert_one(doc! {
            "_id": ObjectId::new(),
            "email": "system",
            "name": "System",
            "alias": "system",
            "avatarUrl": "/icon.png",
            "hidden": true,
            "system": true,
        })
        .await?;
    db.channels()
        .insert_one(doc! {
            "_id": ObjectId::new(),
            "name": "main",
            "description": "",
            "channelType": "PUBLIC",
            "private": false,
            "direct": false,
            "encrypted": false,
            "users": [],
            "createdAt": DateTime::now(),
        })
        .await?;
    Ok(())
}

pub async fn run(db: &Db) -> anyhow::Result<()> {
    let migrations = db.database().collection::<Document>("migrations");
    let applied: Vec<String> = migrations
        .find(doc! {})
        .await?
        .try_collect::<Vec<_>>()
        .await?
        .iter()
        .filter_map(|m| m.get_str("fileName").ok().map(str::to_owned))
        .collect();

    if applied.is_empty() && db.users().count_documents(doc! {}).await? == 0 {
        tracing::info!("empty database, applying baseline schema");
        baseline(db).await?;
        let now = DateTime::now();
        let records: Vec<Document> = LEGACY
            .iter()
            .map(|name| doc! { "fileName": *name, "createdAt": now })
            .collect();
        migrations.insert_many(records).await?;
        return Ok(());
    }

    let missing: Vec<&str> = LEGACY
        .iter()
        .copied()
        .filter(|name| !applied.iter().any(|a| a == name))
        .collect();
    if !missing.is_empty() {
        anyhow::bail!(
            "database is missing legacy migrations, run them before starting: {}",
            missing.join(", ")
        );
    }
    Ok(())
}

pub async fn invite(db: &Db, base_url: &str) -> anyhow::Result<String> {
    let channel = db
        .channels()
        .find_one(doc! { "name": "main", "channelType": "PUBLIC" })
        .await?
        .ok_or_else(|| anyhow::anyhow!("main channel not found"))?;
    let system = db
        .users()
        .find_one(doc! { "email": "system" })
        .await?
        .ok_or_else(|| anyhow::anyhow!("system user not found"))?;
    let token = crate::auth::random_token(16);
    let now = DateTime::now();
    db.invitations()
        .insert_one(doc! {
            "_id": ObjectId::new(),
            "token": &token,
            "userId": crate::doc::id(&system),
            "channelId": crate::doc::id(&channel),
            "expireAt": DateTime::from_millis(now.timestamp_millis() + 1000 * 60 * 60 * 24 * 5),
            "createdAt": now,
        })
        .await?;
    Ok(format!("{base_url}/#/invite/{token}"))
}
