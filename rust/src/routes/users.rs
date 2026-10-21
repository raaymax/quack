use axum::extract::{Path, State};
use axum::routing::get;
use axum::{Json, Router};
use bson::oid::ObjectId;
use bson::{DateTime, Document, doc};
use futures::TryStreamExt;
use serde::Deserialize;
use serde_json::{Map, Value, json};

use crate::auth::Auth;
use crate::doc::{DocExt, oid, to_json};
use crate::error::{AppError, AppResult};
use crate::extract::Body;
use crate::routes::auth::{EncryptedData, PublicKey, hash_password};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list))
        .route("/token/{token}", get(check_token))
        .route("/{id}", get(get_one).post(create))
}

pub fn serialize_user(user: &Document) -> Value {
    let mut map = Map::new();
    map.insert("id".into(), json!(crate::doc::id(user).to_hex()));
    for key in [
        "alias",
        "email",
        "name",
        "avatarFileId",
        "status",
        "publicKey",
        "hidden",
    ] {
        if let Some(value) = user.get(key) {
            map.insert(key.into(), to_json(value));
        }
    }
    Value::Object(map)
}

pub async fn active_invitation(state: &AppState, token: &str) -> AppResult<Option<Document>> {
    Ok(state
        .db
        .invitations()
        .find_one(doc! { "token": token, "expireAt": { "$gt": DateTime::now() } })
        .await?)
}

async fn list(State(state): State<AppState>, _auth: Auth) -> AppResult<Json<Value>> {
    let users: Vec<Document> = state.db.users().find(doc! {}).await?.try_collect().await?;
    Ok(Json(Value::Array(
        users.iter().map(serialize_user).collect(),
    )))
}

async fn get_one(
    State(state): State<AppState>,
    _auth: Auth,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    let user = state
        .db
        .users()
        .find_one(doc! { "_id": oid(&id)? })
        .await?
        .ok_or_else(|| AppError::not_found("User not found"))?;
    Ok(Json(serialize_user(&user)))
}

fn check_token_length(token: &str) -> AppResult<()> {
    if token.len() < 32 {
        return Err(AppError::invalid_field(
            "/params/token",
            "must NOT have fewer than 32 characters",
        ));
    }
    Ok(())
}

async fn check_token(
    State(state): State<AppState>,
    Path(token): Path<String>,
) -> AppResult<Json<Value>> {
    check_token_length(&token)?;
    let valid = active_invitation(&state, &token).await?.is_some();
    Ok(Json(json!({ "valid": valid })))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateUser {
    name: String,
    email: String,
    password: String,
    public_key: Option<PublicKey>,
    secrets: Option<EncryptedData>,
}

crate::required!(CreateUser, "name", "email", "password");

async fn create(
    State(state): State<AppState>,
    Path(token): Path<String>,
    Body(body): Body<CreateUser>,
) -> AppResult<Json<Value>> {
    check_token_length(&token)?;
    let rules = [
        ("/name", body.name.is_empty()),
        ("/email", body.email.len() < 3),
        ("/password", body.password.len() < 3),
    ];
    if let Some((path, _)) = rules.iter().find(|(_, failed)| *failed) {
        return Err(AppError::invalid_field(path, "value too short"));
    }
    let public_key = body
        .public_key
        .ok_or_else(|| AppError::missing_field("publicKey"))?;
    let secrets = body
        .secrets
        .ok_or_else(|| AppError::missing_field("secrets"))?;

    let invitation = active_invitation(&state, &token)
        .await?
        .ok_or_else(|| AppError::bad_request("INVALID_INVITATION", "Invalid invitation link"))?;
    if state
        .db
        .users()
        .find_one(doc! { "email": &body.email })
        .await?
        .is_some()
    {
        return Err(AppError::conflict(
            "USER_ALREADY_EXISTS",
            "User already exists",
        ));
    }

    let channel_id = invitation.oid("channelId");
    let user = doc! {
        "_id": ObjectId::new(),
        "name": &body.name,
        "email": &body.email,
        "publicKey": public_key.to_bson(),
        "secrets": {
            "password": {
                "hash": hash_password(&body.password)?,
                "data": secrets.to_bson(),
                "createdAt": DateTime::now(),
                "kdf": "v2",
            },
        },
        "mainChannelId": channel_id,
    };
    state.db.users().insert_one(&user).await?;
    let user_id = crate::doc::id(&user);

    if let Some(channel_id) = channel_id {
        let channel = state
            .db
            .channels()
            .find_one(doc! { "_id": channel_id })
            .await?;
        if channel.is_some_and(|c| c.str("channelType") != Some("DIRECT")) {
            state
                .db
                .channels()
                .update_one(
                    doc! { "_id": channel_id },
                    doc! { "$push": { "users": user_id } },
                )
                .await?;
        }
    }
    state
        .db
        .invitations()
        .delete_one(doc! { "_id": crate::doc::id(&invitation) })
        .await?;

    Ok(Json(serialize_user(&user)))
}
