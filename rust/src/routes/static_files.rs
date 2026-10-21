use axum::Json;
use axum::body::Body;
use axum::extract::{Request, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use futures::TryStreamExt;
use serde_json::json;
use tower::ServiceExt;
use tower_http::services::ServeDir;

use crate::state::AppState;

fn not_found() -> Response {
    (
        StatusCode::NOT_FOUND,
        Json(json!({ "message": "Not Found" })),
    )
        .into_response()
}

pub async fn serve(State(state): State<AppState>, req: Request) -> Response {
    let public = state.config.public_dir.to_string_lossy();
    if public.starts_with("http") {
        return proxy(&public, req.uri().path()).await;
    }
    match ServeDir::new(&state.config.public_dir).oneshot(req).await {
        Ok(res) if res.status() == StatusCode::NOT_FOUND => not_found(),
        Ok(res) => res.into_response(),
        Err(e) => match e {},
    }
}

async fn proxy(base: &str, path: &str) -> Response {
    let path = if path == "/" { "/index.html" } else { path };
    let url = format!("{}{path}", base.trim_end_matches('/'));
    match reqwest::get(&url).await {
        Ok(upstream) => {
            let mut res = Response::builder().status(upstream.status().as_u16());
            if let Some(content_type) = upstream.headers().get(reqwest::header::CONTENT_TYPE) {
                res = res.header("content-type", content_type.as_bytes());
            }
            let body = Body::from_stream(upstream.bytes_stream().map_err(std::io::Error::other));
            res.body(body).unwrap_or_else(|_| not_found())
        }
        Err(e) => {
            tracing::warn!(url, error = %e, "public dir proxy failed");
            (
                StatusCode::BAD_GATEWAY,
                Json(json!({ "message": "Bad Gateway" })),
            )
                .into_response()
        }
    }
}
