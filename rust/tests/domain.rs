use std::time::Duration;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use bson::oid::ObjectId;
use bson::{DateTime, doc};
use futures::StreamExt;
use quack_server::config::{Config, StorageConfig};
use quack_server::db::Db;
use quack_server::domain::file;
use quack_server::events::DomainEvent;
use quack_server::state::AppState;
use quack_server::storage::{FileMeta, Storage, UploadOpts};
use serde_json::{Value, json};
use tower::ServiceExt;

const DATABASE_URL: &str = "mongodb://chat:chat@localhost:27017/rust_tests?authSource=admin";

async fn state() -> AppState {
    let url = std::env::var("RUST_TEST_DATABASE_URL").unwrap_or_else(|_| DATABASE_URL.into());
    let config = Config {
        port: 0,
        database_url: url.clone(),
        base_url: "http://localhost".into(),
        storage: StorageConfig::Memory,
        webhooks: Vec::new(),
        public_dir: "public".into(),
        app_version: None,
        giphy_api_key: None,
    };
    let db = Db::connect(&url)
        .await
        .expect("mongodb is required for integration tests");
    let storage = Storage::new(&config.storage).unwrap();
    AppState::new(config, db, storage, quack_server::commands::builtin())
}

async fn user(state: &AppState) -> (ObjectId, String) {
    let id = ObjectId::new();
    let token = quack_server::auth::random_token(32);
    state
        .db
        .users()
        .insert_one(doc! { "_id": id, "name": "tester", "email": id.to_hex() })
        .await
        .unwrap();
    let expires = DateTime::from_millis(DateTime::now().timestamp_millis() + 60_000);
    state
        .db
        .sessions()
        .insert_one(
            doc! { "_id": ObjectId::new(), "userId": id, "token": &token, "expires": expires },
        )
        .await
        .unwrap();
    (id, token)
}

async fn channel(state: &AppState, users: &[ObjectId]) -> ObjectId {
    let id = ObjectId::new();
    state
        .db
        .channels()
        .insert_one(
            doc! { "_id": id, "name": id.to_hex(), "channelType": "PUBLIC", "users": users },
        )
        .await
        .unwrap();
    id
}

async fn draft(
    state: &AppState,
    channel_id: ObjectId,
    user_id: ObjectId,
    contents: &'static str,
) -> (ObjectId, String) {
    let body =
        futures::stream::once(async move { Ok(bytes::Bytes::from_static(contents.as_bytes())) })
            .boxed();
    let opts = UploadOpts {
        filename: "a.txt".into(),
        content_type: "text/plain".into(),
        size: None,
    };
    let (storage_id, meta): (String, FileMeta) = state.storage.upload(body, opts).await.unwrap();
    let id = file::register(
        state,
        channel_id,
        user_id,
        &storage_id,
        &meta,
        Some(meta.size),
    )
    .await
    .unwrap();
    (id, storage_id)
}

#[tokio::test]
async fn stale_drafts_are_swept_but_attached_files_survive() {
    let state = state().await;
    let (user_id, _) = user(&state).await;
    let channel_id = channel(&state, &[user_id]).await;
    let old_draft = draft(&state, channel_id, user_id, "old draft").await;
    let old_attached = draft(&state, channel_id, user_id, "old attached").await;
    let fresh = draft(&state, channel_id, user_id, "fresh").await;
    file::attach_to_channel(&state, old_attached.0, channel_id, user_id)
        .await
        .unwrap();

    let backdated = DateTime::from_millis(DateTime::now().timestamp_millis() - 25 * 60 * 60 * 1000);
    for id in [old_draft.0, old_attached.0] {
        state
            .db
            .files()
            .update_one(
                doc! { "_id": id },
                doc! { "$set": { "createdAt": backdated } },
            )
            .await
            .unwrap();
    }

    file::remove_stale_drafts(&state, 24 * 60 * 60 * 1000)
        .await
        .unwrap();

    assert!(file::get(&state, old_draft.0).await.unwrap().is_none());
    assert!(!state.storage.exists(&old_draft.1).await.unwrap());
    let attached = file::get(&state, old_attached.0).await.unwrap().unwrap();
    assert_eq!(attached.get_str("status").unwrap(), "attached");
    assert!(state.storage.exists(&old_attached.1).await.unwrap());
    assert_eq!(
        file::get(&state, fresh.0)
            .await
            .unwrap()
            .unwrap()
            .get_str("status")
            .unwrap(),
        "draft"
    );
    assert!(state.storage.exists(&fresh.1).await.unwrap());
}

#[tokio::test]
async fn attaching_twice_emits_a_single_client_safe_event() {
    let state = state().await;
    let (user_id, _) = user(&state).await;
    let channel_id = channel(&state, &[user_id]).await;
    let (file_id, _) = draft(&state, channel_id, user_id, "twice").await;
    let mut rx = state.bus.subscribe();

    file::attach_to_channel(&state, file_id, channel_id, user_id)
        .await
        .unwrap();
    file::attach_to_channel(&state, file_id, channel_id, user_id)
        .await
        .unwrap();

    let mut events = Vec::new();
    while let Ok(envelope) = rx.try_recv() {
        if envelope.reaches(&user_id) && envelope.payload["type"] == "file" {
            events.push(envelope.payload.clone());
        }
    }
    assert_eq!(events.len(), 1);
    assert_eq!(events[0]["id"], json!(file_id.to_hex()));
    assert!(events[0].get("storageId").is_none());
}

async fn send(state: &AppState, request: Request<Body>) -> (StatusCode, Value) {
    let response = quack_server::app::router(state.clone())
        .oneshot(request)
        .await
        .unwrap();
    let status = response.status();
    let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    (
        status,
        serde_json::from_slice(&bytes).unwrap_or(Value::Null),
    )
}

#[tokio::test]
async fn interactions_are_published_as_domain_events() {
    let state = state().await;
    let (user_id, token) = user(&state).await;
    let channel_id = channel(&state, &[user_id]).await;
    let mut rx = state.events.subscribe();

    let body = json!({ "channelId": channel_id.to_hex(), "clientId": "c-1", "action": "test:click", "payload": { "n": 1 } });
    let request = Request::post("/api/interactions")
        .header("authorization", format!("Bearer {token}"))
        .header("content-type", "application/json")
        .body(Body::from(body.to_string()))
        .unwrap();
    let (status, _) = send(&state, request).await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let event = tokio::time::timeout(Duration::from_secs(1), rx.recv())
        .await
        .unwrap()
        .unwrap();
    let DomainEvent::MessageInteraction(payload) = event else {
        panic!("unexpected event")
    };
    assert_eq!(payload["userId"], json!(user_id.to_hex()));
    assert_eq!(payload["action"], json!("test:click"));
    assert_eq!(payload["payload"], json!({ "n": 1 }));
}

#[tokio::test]
async fn rejected_emoji_upload_does_not_leak_its_blob() {
    let state = state().await;
    let (_, token) = user(&state).await;
    let shortname = format!(":leak-{}:", ObjectId::new().to_hex());
    let upload = || {
        Request::post(format!("/api/emojis/{shortname}"))
            .header("authorization", format!("Bearer {token}"))
            .header("content-type", "image/png")
            .header("content-disposition", "attachment; filename=\"e.png\"")
            .body(Body::from(vec![0x89, 0x50, 0x4e, 0x47]))
            .unwrap()
    };

    let (status, first) = send(&state, upload()).await;
    assert_eq!(status, StatusCode::OK);
    let kept = first["emoji"]["fileId"].as_str().unwrap().to_owned();

    let (status, body) = send(&state, upload()).await;
    assert_eq!(status, StatusCode::CONFLICT);
    assert_eq!(body["errorCode"], json!("EMOJI_ALREADY_EXISTS"));

    assert!(state.storage.exists(&kept).await.unwrap());
    let rejected = format!(
        "f-{}",
        kept.trim_start_matches("f-").parse::<u64>().unwrap() + 1
    );
    assert!(!state.storage.exists(&rejected).await.unwrap());
}
