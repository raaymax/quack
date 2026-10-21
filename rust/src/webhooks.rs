use std::time::Duration;

use serde_json::json;
use tokio::sync::broadcast::error::RecvError;

use crate::state::AppState;

const TIMEOUT: Duration = Duration::from_secs(10);

pub fn spawn(state: AppState) {
    if state.config.webhooks.is_empty() {
        return;
    }
    let client = match reqwest::Client::builder().timeout(TIMEOUT).build() {
        Ok(client) => client,
        Err(e) => {
            tracing::error!(error = %e, "webhook client init failed");
            return;
        }
    };
    let mut rx = state.bus.subscribe();
    tokio::spawn(async move {
        loop {
            let envelope = match rx.recv().await {
                Ok(envelope) => envelope,
                Err(RecvError::Lagged(skipped)) => {
                    tracing::warn!(skipped, "webhooks lagged");
                    continue;
                }
                Err(RecvError::Closed) => break,
            };
            let event = envelope.notification();
            let kind = event
                .get("type")
                .and_then(|t| t.as_str())
                .unwrap_or_default()
                .to_owned();
            for hook in &state.config.webhooks {
                if hook
                    .events
                    .as_ref()
                    .is_some_and(|events| !events.contains(&kind))
                {
                    continue;
                }
                let request = client
                    .post(&hook.url)
                    .json(&json!({ "type": kind, "event": event }));
                let url = hook.url.clone();
                tokio::spawn(async move {
                    match request.send().await {
                        Ok(res) if !res.status().is_success() => {
                            tracing::warn!(url, status = %res.status(), "webhook rejected");
                        }
                        Ok(_) => tracing::debug!(url, "webhook delivered"),
                        Err(e) => tracing::warn!(url, error = %e, "webhook delivery failed"),
                    }
                });
            }
        }
    });
}
