use axum::body::Body as RawBody;
use axum::extract::{Path, State};
use axum::http::header::{CONTENT_DISPOSITION, CONTENT_LENGTH, CONTENT_TYPE};
use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use bson::doc;
use futures::TryStreamExt;
use serde::Deserialize;
use serde_json::{Value, json};

use crate::auth::Auth;
use crate::doc::{DocExt, oid};
use crate::domain::{channel, file};
use crate::error::{AppError, AppResult};
use crate::extract::{Query, query_bool, query_float};
use crate::routes::upload;
use crate::state::AppState;
use crate::storage::{FileData, StorageError};

const INLINE_SAFE_TYPES: [&str; 4] = ["image/png", "image/jpeg", "image/gif", "image/webp"];

pub fn storage_router() -> Router<AppState> {
    Router::new()
        .route("/", axum::routing::post(storage_upload))
        .route("/{file_id}", get(storage_download).delete(storage_remove))
}

pub fn channel_router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(channel_upload))
        .route("/{file_id}", get(channel_download).delete(channel_remove))
}

#[derive(Deserialize)]
struct DownloadQuery {
    download: Option<String>,
    w: Option<String>,
    h: Option<String>,
}

struct Download {
    download: bool,
    width: Option<f64>,
    height: Option<f64>,
}

impl DownloadQuery {
    fn parse(self) -> AppResult<Download> {
        Ok(Download {
            download: query_bool("download", self.download.as_deref())?.unwrap_or(false),
            width: query_float("w", self.w.as_deref())?,
            height: query_float("h", self.h.as_deref())?,
        })
    }
}

fn stream_response(file: FileData, disposition: Option<String>) -> Response {
    let mut headers = HeaderMap::new();
    if let Ok(value) = HeaderValue::from_str(&file.meta.content_type) {
        headers.insert(CONTENT_TYPE, value);
    }
    headers.insert(CONTENT_LENGTH, HeaderValue::from(file.meta.size));
    if let Some(value) = disposition.and_then(|d| HeaderValue::from_str(&d).ok()) {
        headers.insert(CONTENT_DISPOSITION, value);
    }
    (headers, RawBody::from_stream(file.body)).into_response()
}

fn safe_name(name: &str) -> String {
    name.chars()
        .map(|c| {
            if matches!(c, '\r' | '\n' | '"' | '\\') {
                '_'
            } else {
                c
            }
        })
        .collect()
}

async fn storage_upload(
    State(state): State<AppState>,
    _auth: Auth,
    headers: HeaderMap,
    body: RawBody,
) -> AppResult<Json<Value>> {
    let (id, _) = state
        .storage
        .upload(upload::stream(body), upload::opts(&headers, "file"))
        .await?;
    Ok(Json(json!({ "status": "ok", "id": id })))
}

async fn storage_download(
    State(state): State<AppState>,
    _auth: Auth,
    Path(file_id): Path<String>,
    Query(query): Query<DownloadQuery>,
) -> AppResult<Response> {
    let query = query.parse()?;
    match state.storage.get(&file_id, query.width, query.height).await {
        Ok(file) => {
            let disposition = query.download.then(|| {
                format!(
                    "attachment; filename=\"{}\"",
                    safe_name(&file.meta.filename)
                )
            });
            Ok(stream_response(file, disposition))
        }
        Err(StorageError::NotFound) => Ok((
            StatusCode::NOT_FOUND,
            Json(json!({
                "errorCode": "RESOURCE_NOT_FOUND",
                "message": "Specified file not found or does not exist",
            })),
        )
            .into_response()),
        Err(e) => Err(e.into()),
    }
}

async fn storage_remove(
    State(state): State<AppState>,
    _auth: Auth,
    Path(file_id): Path<String>,
) -> AppResult<StatusCode> {
    state.storage.remove(&file_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn list(
    State(state): State<AppState>,
    auth: Auth,
    Path(channel_id): Path<String>,
) -> AppResult<Json<Value>> {
    let channel_id = oid(&channel_id)?;
    channel::access(&state, channel_id, auth.user_id).await?;
    let files: Vec<_> = state
        .db
        .files()
        .find(doc! { "channelId": channel_id, "status": file::ATTACHED })
        .sort(doc! { "createdAt": -1 })
        .await?
        .try_collect()
        .await?;
    Ok(Json(Value::Array(
        files.iter().map(file::client_file).collect(),
    )))
}

#[derive(Deserialize)]
struct UploadQuery {
    attach: Option<String>,
}

async fn channel_upload(
    State(state): State<AppState>,
    auth: Auth,
    Path(channel_id): Path<String>,
    Query(query): Query<UploadQuery>,
    headers: HeaderMap,
    body: RawBody,
) -> AppResult<Json<Value>> {
    let channel_id = oid(&channel_id)?;
    let attach = match query.attach.as_deref() {
        None => false,
        Some("channel") => true,
        Some(_) => {
            return Err(AppError::invalid_field(
                "/querystring/attach",
                "must be equal to one of the allowed values",
            ));
        }
    };
    channel::access(&state, channel_id, auth.user_id).await?;
    let (storage_id, meta) = state
        .storage
        .upload(upload::stream(body), upload::opts(&headers, "file"))
        .await?;
    let id = file::register(
        &state,
        channel_id,
        auth.user_id,
        &storage_id,
        &meta,
        Some(meta.size),
    )
    .await?;
    if attach {
        file::attach_to_channel(&state, id, channel_id, auth.user_id).await?;
    }
    let entry = file::get(&state, id)
        .await?
        .ok_or_else(|| AppError::not_found("File not found"))?;
    Ok(Json(
        json!({ "status": "ok", "file": file::client_file(&entry) }),
    ))
}

async fn channel_download(
    State(state): State<AppState>,
    auth: Auth,
    Path((channel_id, file_id)): Path<(String, String)>,
    Query(query): Query<DownloadQuery>,
) -> AppResult<Response> {
    let query = query.parse()?;
    let channel_id = oid(&channel_id)?;
    let file_id = oid(&file_id)?;
    channel::access(&state, channel_id, auth.user_id).await?;
    let not_found = || AppError::new(StatusCode::NOT_FOUND, "FILE_NOT_FOUND", "File not found");
    let entry = file::get(&state, file_id)
        .await?
        .filter(|f| {
            f.oid("channelId") == Some(channel_id) && f.str("status") != Some(file::DELETED)
        })
        .ok_or_else(not_found)?;
    let storage_id = entry.str("storageId").ok_or_else(not_found)?;
    let data = state
        .storage
        .get(storage_id, query.width, query.height)
        .await?;
    let inline = !query.download && INLINE_SAFE_TYPES.contains(&data.meta.content_type.as_str());
    let name = safe_name(entry.str("fileName").unwrap_or("file"));
    let disposition = format!(
        "{}; filename=\"{name}\"",
        if inline { "inline" } else { "attachment" }
    );
    let mut response = stream_response(data, Some(disposition));
    response.headers_mut().insert(
        "x-content-type-options",
        HeaderValue::from_static("nosniff"),
    );
    Ok(response)
}

async fn channel_remove(
    State(state): State<AppState>,
    auth: Auth,
    Path((_channel_id, file_id)): Path<(String, String)>,
) -> AppResult<StatusCode> {
    file::remove(&state, oid(&file_id)?, auth.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
