use std::time::Instant;

use axum::Router;
use axum::extract::Request;
use axum::middleware::{self, Next};
use axum::response::Response;
use tower::Layer;
use tower_http::normalize_path::{NormalizePath, NormalizePathLayer};

use crate::routes;
use crate::state::AppState;

pub fn router(state: AppState) -> NormalizePath<Router> {
    let router = Router::new()
        .nest("/api", routes::api())
        .fallback(routes::static_files::serve)
        .layer(middleware::from_fn(log_request))
        .with_state(state);
    NormalizePathLayer::trim_trailing_slash().layer(router)
}

async fn log_request(req: Request, next: Next) -> Response {
    let method = req.method().clone();
    let uri = req.uri().clone();
    let start = Instant::now();
    let res = next.run(req).await;
    let elapsed = start.elapsed().as_millis();
    let status = res.status().as_u16();
    if status >= 500 || elapsed >= 2000 {
        tracing::warn!("{method} {uri} {status} {elapsed}ms");
    } else {
        tracing::info!("{method} {uri} {status} {elapsed}ms");
    }
    res
}

const DRAFT_SWEEP_INTERVAL: std::time::Duration = std::time::Duration::from_secs(60 * 60);
const DRAFT_MAX_AGE_MS: i64 = 24 * 60 * 60 * 1000;

pub fn spawn_jobs(state: AppState) {
    crate::webhooks::spawn(state.clone());
    tokio::spawn(async move {
        let mut ticker = tokio::time::interval(DRAFT_SWEEP_INTERVAL);
        loop {
            tokio::select! {
                _ = ticker.tick() => {
                    if let Err(e) = crate::domain::file::remove_stale_drafts(&state, DRAFT_MAX_AGE_MS).await {
                        tracing::warn!(error = ?e, "stale draft sweep failed");
                    }
                }
                _ = state.shutdown.cancelled() => break,
            }
        }
    });
}
