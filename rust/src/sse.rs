use std::convert::Infallible;
use std::time::Duration;

use axum::body::Body;
use axum::http::header::{CACHE_CONTROL, CONNECTION, CONTENT_TYPE};
use axum::response::{IntoResponse, Response};
use bytes::Bytes;
use futures::Stream;
use serde_json::Value;
use tokio::sync::broadcast::error::RecvError;

use tokio_util::sync::CancellationToken;

use crate::bus::{Bus, Envelope};

const KEEP_ALIVE: Duration = Duration::from_secs(3);

pub fn frame(value: &Value) -> Bytes {
    Bytes::from(format!("data:{value}\n\n"))
}

pub fn response<S>(stream: S) -> Response
where
    S: Stream<Item = Result<Bytes, Infallible>> + Send + 'static,
{
    (
        [
            (CONTENT_TYPE, "text/event-stream"),
            (CACHE_CONTROL, "no-cache"),
            (CONNECTION, "keep-alive"),
        ],
        Body::from_stream(stream),
    )
        .into_response()
}

pub fn events<F>(
    bus: &Bus,
    shutdown: CancellationToken,
    first: Value,
    mut map: F,
) -> impl Stream<Item = Result<Bytes, Infallible>> + Send + 'static
where
    F: FnMut(&Envelope) -> Option<Value> + Send + 'static,
{
    let mut rx = bus.subscribe();
    async_stream::stream! {
        yield Ok(frame(&first));
        let mut ticker = tokio::time::interval(KEEP_ALIVE);
        ticker.tick().await;
        loop {
            tokio::select! {
                received = rx.recv() => match received {
                    Ok(envelope) => {
                        if let Some(value) = map(&envelope) {
                            yield Ok(frame(&value));
                        }
                    }
                    Err(RecvError::Lagged(skipped)) => tracing::warn!(skipped, "sse subscriber lagged"),
                    Err(RecvError::Closed) => break,
                },
                _ = ticker.tick() => yield Ok(Bytes::from_static(b":keep-alive\n\n")),
                _ = shutdown.cancelled() => break,
            }
        }
    }
}
