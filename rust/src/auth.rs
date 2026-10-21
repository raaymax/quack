use axum::extract::{FromRequestParts, OptionalFromRequestParts};
use axum::http::header::AUTHORIZATION;
use axum::http::request::Parts;
use axum_extra::extract::CookieJar;
use bson::oid::ObjectId;
use bson::{DateTime, Document, doc};

use crate::doc::DocExt;
use crate::error::AppError;
use crate::state::AppState;

#[derive(Clone)]
pub struct Auth {
    pub user_id: ObjectId,
    pub user: Document,
    pub session: Document,
}

impl Auth {
    pub fn session_id(&self) -> ObjectId {
        crate::doc::id(&self.session)
    }
}

pub fn request_token(parts: &Parts) -> Option<String> {
    let bearer = parts
        .headers
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split_whitespace().nth(1))
        .map(str::to_owned);
    bearer.or_else(|| {
        CookieJar::from_headers(&parts.headers)
            .get("token")
            .map(|c| c.value().to_owned())
    })
}

async fn resolve(parts: &mut Parts, state: &AppState) -> Result<Option<Auth>, AppError> {
    if let Some(auth) = parts.extensions.get::<Option<Auth>>() {
        return Ok(auth.clone());
    }
    let auth = match request_token(parts) {
        Some(token) => lookup(state, &token).await?,
        None => None,
    };
    parts.extensions.insert(auth.clone());
    Ok(auth)
}

async fn lookup(state: &AppState, token: &str) -> Result<Option<Auth>, AppError> {
    let Some(session) = state
        .db
        .sessions()
        .find_one(doc! { "token": token, "expires": { "$gt": DateTime::now() } })
        .await?
    else {
        return Ok(None);
    };
    let Some(user_id) = session.oid("userId") else {
        return Ok(None);
    };
    let Some(user) = state.db.users().find_one(doc! { "_id": user_id }).await? else {
        return Ok(None);
    };
    Ok(Some(Auth {
        user_id,
        user,
        session,
    }))
}

impl FromRequestParts<AppState> for Auth {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        resolve(parts, state)
            .await?
            .ok_or_else(|| AppError::access_denied("Access Denied"))
    }
}

impl OptionalFromRequestParts<AppState> for Auth {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Option<Self>, Self::Rejection> {
        resolve(parts, state).await
    }
}

pub fn random_token(bytes: usize) -> String {
    let mut buf = vec![0u8; bytes];
    rand::fill(&mut buf[..]);
    hex::encode(buf)
}
