use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use axum_extra::extract::CookieJar;
use axum_extra::extract::cookie::{Cookie, SameSite};
use bson::oid::ObjectId;
use bson::{DateTime, Document, doc};
use serde::Deserialize;
use serde_json::{Map, Value, json};

use crate::auth::{Auth, random_token};
use crate::doc::{DocExt, doc_to_json, to_json};
use crate::error::{AppError, AppResult};
use crate::extract::Body;
use crate::state::AppState;

pub const SESSION_TTL_SECONDS: i64 = 60 * 60 * 24 * 60;

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/session",
            get(get_session).post(create_session).delete(delete_session),
        )
        .route("/reset/{token}", get(verify_reset).put(reset))
}

pub fn hash_password(password: &str) -> AppResult<String> {
    Argon2::default()
        .hash_password(password.as_bytes())
        .map(|h| h.to_string())
        .map_err(|e| AppError::internal(format!("hashing failed: {e}")))
}

fn verify_password(hash: &str, password: &str) -> bool {
    PasswordHash::new(hash).is_ok_and(|parsed| {
        Argon2::default()
            .verify_password(password.as_bytes(), &parsed)
            .is_ok()
    })
}

fn token_cookie(state: &AppState, token: String) -> Cookie<'static> {
    Cookie::build(("token", token))
        .http_only(true)
        .path("/")
        .max_age(cookie::time::Duration::seconds(SESSION_TTL_SECONDS))
        .same_site(SameSite::Lax)
        .secure(state.config.secure_cookies())
        .build()
}

fn removal(name: &'static str) -> Cookie<'static> {
    Cookie::build((name, "")).path("/").build()
}

fn expires_from_now() -> DateTime {
    DateTime::from_millis(DateTime::now().timestamp_millis() + SESSION_TTL_SECONDS * 1000)
}

fn session_json(session: &Document, user: &Document) -> Map<String, Value> {
    let Value::Object(mut map) = doc_to_json(session) else {
        unreachable!()
    };
    let password = user
        .get_document("secrets")
        .and_then(|s| s.get_document("password"))
        .ok();
    let secrets = password
        .and_then(|p| p.get("data"))
        .map(to_json)
        .unwrap_or(Value::Null);
    map.insert("secrets".into(), secrets);
    map.insert(
        "publicKey".into(),
        user.get("publicKey").map(to_json).unwrap_or(Value::Null),
    );
    map
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Credentials {
    email: String,
    password: String,
    legacy_password: Option<String>,
}

crate::required!(Credentials, "email", "password");

async fn create_session(
    State(state): State<AppState>,
    jar: CookieJar,
    Body(body): Body<Credentials>,
) -> AppResult<Response> {
    let users = state.db.users();
    let invalid = || AppError::access_denied("Invalid login or password");
    let user = users
        .find_one(doc! { "email": &body.email })
        .await?
        .ok_or_else(invalid)?;

    if user.contains_key("password") {
        let token = random_token(16);
        users
            .update_one(
                doc! { "email": &body.email },
                doc! { "$set": { "resetToken": &token } },
            )
            .await?;
        return Err(AppError::new(
            StatusCode::FORBIDDEN,
            "PASSWORD_RESET_REQUIRED",
            "Authentication method is outdated - password reset is required",
        )
        .with("token", json!(token)));
    }

    let password = user
        .get_document("secrets")
        .and_then(|s| s.get_document("password"))
        .map_err(|_| invalid())?
        .clone();
    let stored = password.str("hash").ok_or_else(invalid)?;
    if !verify_password(stored, &body.password) {
        let legacy_ok = body
            .legacy_password
            .as_deref()
            .is_some_and(|legacy| verify_password(stored, legacy));
        if !legacy_ok {
            return Err(invalid());
        }
        let mut upgraded = password.clone();
        upgraded.insert("hash", hash_password(&body.password)?);
        upgraded.insert("kdf", "v2");
        users
            .update_one(
                doc! { "email": &body.email },
                doc! { "$set": { "secrets.password": upgraded } },
            )
            .await?;
    }

    let session = doc! {
        "_id": ObjectId::new(),
        "userId": crate::doc::id(&user),
        "token": random_token(32),
        "expires": expires_from_now(),
    };
    state.db.sessions().insert_one(&session).await?;

    let mut body = session_json(&session, &user);
    body.insert("status".into(), json!("ok"));
    let token = session.str("token").unwrap_or_default().to_owned();
    Ok((
        jar.add(token_cookie(&state, token)),
        Json(Value::Object(body)),
    )
        .into_response())
}

async fn get_session(
    State(state): State<AppState>,
    jar: CookieJar,
    auth: Option<Auth>,
) -> AppResult<Response> {
    let Some(auth) = auth else {
        let jar = if jar.get("token").is_some() {
            jar.remove(removal("token"))
        } else {
            jar
        };
        return Ok((jar, Json(json!({ "status": "no-session" }))).into_response());
    };
    state
        .db
        .sessions()
        .update_one(
            doc! { "_id": auth.session_id() },
            doc! { "$set": { "expires": expires_from_now() } },
        )
        .await?;
    let mut body = session_json(&auth.session, &auth.user);
    body.insert("user".into(), json!(auth.user_id.to_hex()));
    body.insert("status".into(), json!("ok"));
    let token = auth.session.str("token").unwrap_or_default().to_owned();
    Ok((
        jar.add(token_cookie(&state, token)),
        Json(Value::Object(body)),
    )
        .into_response())
}

async fn delete_session(
    State(state): State<AppState>,
    jar: CookieJar,
    auth: Auth,
) -> AppResult<Response> {
    state
        .db
        .sessions()
        .delete_one(doc! { "_id": auth.session_id() })
        .await?;
    let jar = jar.remove(removal("token")).remove(removal("key"));
    Ok((jar, StatusCode::NO_CONTENT).into_response())
}

async fn verify_reset(
    State(state): State<AppState>,
    Path(token): Path<String>,
) -> AppResult<Json<Value>> {
    let user = state
        .db
        .users()
        .find_one(doc! { "resetToken": token })
        .await?;
    Ok(Json(match user {
        Some(user) => json!({ "valid": true, "email": user.str("email") }),
        None => json!({ "valid": false }),
    }))
}

#[derive(Deserialize)]
pub struct PublicKey {
    crv: String,
    ext: bool,
    key_ops: Vec<String>,
    kty: String,
    x: String,
    y: String,
}

impl PublicKey {
    pub fn to_bson(&self) -> Document {
        doc! {
            "crv": &self.crv,
            "ext": self.ext,
            "key_ops": &self.key_ops,
            "kty": &self.kty,
            "x": &self.x,
            "y": &self.y,
        }
    }
}

#[derive(Deserialize)]
pub struct EncryptedData {
    encrypted: String,
    _iv: String,
}

impl EncryptedData {
    pub fn to_bson(&self) -> Document {
        doc! { "encrypted": &self.encrypted, "_iv": &self._iv }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResetBody {
    email: String,
    password: String,
    old_password: Option<String>,
    public_key: Value,
    secrets: EncryptedData,
}

crate::required!(ResetBody, "email", "password", "publicKey", "secrets");

async fn reset(
    State(state): State<AppState>,
    Path(_token): Path<String>,
    Body(body): Body<ResetBody>,
) -> AppResult<Json<Value>> {
    let public_key: PublicKey = serde_json::from_value(body.public_key.clone())
        .map_err(|e| AppError::invalid_field("/publicKey", e.to_string()))?;
    let old_password = body
        .old_password
        .ok_or_else(|| AppError::missing_field("oldPassword"))?;
    let users = state.db.users();
    let user = users
        .find_one(doc! { "email": &body.email })
        .await?
        .ok_or_else(|| AppError::not_found("User not found"))?;
    let legacy = user
        .str("password")
        .ok_or_else(|| AppError::not_found("No old credentials to reset"))?;
    if !bcrypt::verify(&old_password, legacy).unwrap_or(false) {
        return Err(AppError::no_access("Access denied"));
    }
    let secret = doc! {
        "hash": hash_password(&body.password)?,
        "data": body.secrets.to_bson(),
        "createdAt": DateTime::now(),
    };
    users
        .update_one(
            doc! { "_id": crate::doc::id(&user) },
            doc! {
                "$set": { "publicKey": public_key.to_bson(), "secrets.password": secret },
                "$unset": { "password": 1, "resetToken": 1 },
            },
        )
        .await?;
    Ok(Json(json!({ "status": "ok" })))
}
