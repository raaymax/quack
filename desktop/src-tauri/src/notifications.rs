use std::sync::Arc;
use std::time::Duration;

use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;
use tokio::sync::Mutex;
use tokio::task::JoinHandle;

/// Connection state reported to the frontend and tray
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ConnectionStatus {
    Disconnected,
    Connecting,
    Connected,
    Reconnecting,
}

/// Notification event from the server SSE stream
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
struct NotificationEvent {
    #[serde(rename = "type")]
    event_type: Option<String>,
    channel_id: Option<String>,
    parent_id: Option<String>,
    title: Option<String>,
    body: Option<String>,
    sender_id: Option<String>,
    sender_name: Option<String>,
}

/// Credentials needed for the SSE connection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credentials {
    pub server_url: String,
    pub auth_token: String,
    pub user_id: String,
}

/// Shared state for the notification service
pub struct NotificationService {
    task: Option<JoinHandle<()>>,
    status: ConnectionStatus,
    credentials: Option<Credentials>,
}

impl NotificationService {
    pub fn new() -> Arc<Mutex<Self>> {
        Arc::new(Mutex::new(Self {
            task: None,
            status: ConnectionStatus::Disconnected,
            credentials: None,
        }))
    }
}

/// Start the SSE notification service
pub async fn start(
    app: &AppHandle,
    service: &Arc<Mutex<NotificationService>>,
    credentials: Credentials,
) {
    let mut svc = service.lock().await;

    // Stop existing task if running
    if let Some(task) = svc.task.take() {
        task.abort();
    }

    svc.credentials = Some(credentials.clone());
    svc.status = ConnectionStatus::Connecting;
    drop(svc);

    update_tray_tooltip(app, &ConnectionStatus::Connecting);
    let _ = app.emit("notification-service-status", "connecting");

    let app_handle = app.clone();
    let service_clone = Arc::clone(service);

    let task = tokio::spawn(async move {
        sse_loop(&app_handle, &service_clone, &credentials).await;
    });

    let mut svc = service.lock().await;
    svc.task = Some(task);
}

/// Stop the SSE notification service
pub async fn stop(app: &AppHandle, service: &Arc<Mutex<NotificationService>>) {
    let mut svc = service.lock().await;

    if let Some(task) = svc.task.take() {
        task.abort();
    }

    svc.status = ConnectionStatus::Disconnected;
    svc.credentials = None;

    update_tray_tooltip(app, &ConnectionStatus::Disconnected);
    let _ = app.emit("notification-service-status", "disconnected");
}

/// Get current connection status
pub async fn status(service: &Arc<Mutex<NotificationService>>) -> ConnectionStatus {
    let svc = service.lock().await;
    svc.status.clone()
}

/// Main SSE loop with exponential backoff reconnection
async fn sse_loop(
    app: &AppHandle,
    service: &Arc<Mutex<NotificationService>>,
    credentials: &Credentials,
) {
    let client = Client::builder()
        .connect_timeout(Duration::from_secs(30))
        .build()
        .expect("failed to create HTTP client");

    let mut backoff = Duration::from_secs(1);
    let max_backoff = Duration::from_secs(60);

    loop {
        let url = format!(
            "{}/api/notifications",
            credentials.server_url.trim_end_matches('/')
        );

        log::info!("SSE connecting to {}", url);
        set_status(app, service, ConnectionStatus::Connecting).await;

        match connect_sse(&client, &url, &credentials.auth_token, &credentials.user_id, app).await
        {
            Ok(()) => {
                // Clean disconnect — server closed the stream
                log::info!("SSE stream ended cleanly");
                backoff = Duration::from_secs(1);
            }
            Err(e) => {
                log::error!("SSE connection error: {}", e);
            }
        }

        set_status(app, service, ConnectionStatus::Reconnecting).await;

        log::info!("Reconnecting in {:?}", backoff);
        tokio::time::sleep(backoff).await;

        // Exponential backoff: 1s → 2s → 4s → ... → 60s
        backoff = (backoff * 2).min(max_backoff);
    }
}

/// Connect to the SSE endpoint and process events
async fn connect_sse(
    client: &Client,
    url: &str,
    token: &str,
    user_id: &str,
    app: &AppHandle,
) -> Result<(), String> {
    let response = client
        .get(url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Accept", "text/event-stream")
        .header("Cache-Control", "no-cache")
        .send()
        .await
        .map_err(|e| format!("request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status()));
    }

    let mut buffer = String::new();
    let mut stream = response.bytes_stream();

    use futures_util::StreamExt;

    let mut connected = false;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("stream read error: {}", e))?;
        let text = String::from_utf8_lossy(&chunk);
        buffer.push_str(&text);

        // Process complete SSE messages (terminated by double newline)
        while let Some(pos) = buffer.find("\n\n") {
            let message = buffer[..pos].to_string();
            buffer = buffer[pos + 2..].to_string();

            if let Some(data) = extract_sse_data(&message) {
                if !connected {
                    // First message is the connection confirmation
                    connected = true;
                    let _ = app.emit("notification-service-status", "connected");
                    // Reset tray to connected
                    update_tray_tooltip(app, &ConnectionStatus::Connected);
                    log::info!("SSE connected");
                    continue;
                }

                handle_event(data, user_id, app);
            }
        }
    }

    Ok(())
}

/// Extract the `data:` field from an SSE message
fn extract_sse_data(message: &str) -> Option<&str> {
    for line in message.lines() {
        if let Some(data) = line.strip_prefix("data:") {
            return Some(data.trim());
        }
    }
    None
}

/// Handle a parsed SSE event
fn handle_event(data: &str, user_id: &str, app: &AppHandle) {
    let event: NotificationEvent = match serde_json::from_str(data) {
        Ok(e) => e,
        Err(e) => {
            log::warn!("Failed to parse SSE event: {} — data: {}", e, data);
            return;
        }
    };

    // Ignore pings
    if event.event_type.as_deref() == Some("ping") {
        return;
    }

    // Ignore non-notification events
    if event.event_type.as_deref() != Some("notification") {
        return;
    }

    // Skip own messages (server should already filter, but double-check)
    if event.sender_id.as_deref() == Some(user_id) {
        return;
    }

    let title = event.title.unwrap_or_else(|| "New message".to_string());
    let body = event.body.unwrap_or_default();

    // Check if main window is visible and focused — suppress notification if so
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) && window.is_focused().unwrap_or(false) {
            // Window is focused, emit event for the web app but skip OS notification
            let _ = app.emit("notification-message", data);
            return;
        }
    }

    // Fire OS notification
    let _ = app
        .notification()
        .builder()
        .title(&title)
        .body(&body)
        .show();

    // Also emit to the web app for in-app handling
    let _ = app.emit("notification-message", data);
}

/// Update the tray tooltip with connection status
fn update_tray_tooltip(app: &AppHandle, status: &ConnectionStatus) {
    if let Some(tray) = app.tray_by_id("main") {
        let tooltip = match status {
            ConnectionStatus::Connected => "Quack — Connected",
            ConnectionStatus::Connecting => "Quack — Connecting...",
            ConnectionStatus::Reconnecting => "Quack — Reconnecting...",
            ConnectionStatus::Disconnected => "Quack — Disconnected",
        };
        let _ = tray.set_tooltip(Some(tooltip));
    }
}

/// Update shared status and emit event
async fn set_status(
    app: &AppHandle,
    service: &Arc<Mutex<NotificationService>>,
    new_status: ConnectionStatus,
) {
    let mut svc = service.lock().await;
    svc.status = new_status.clone();
    drop(svc);

    let status_str = match new_status {
        ConnectionStatus::Connected => "connected",
        ConnectionStatus::Connecting => "connecting",
        ConnectionStatus::Reconnecting => "reconnecting",
        ConnectionStatus::Disconnected => "disconnected",
    };

    update_tray_tooltip(app, &new_status);
    let _ = app.emit("notification-service-status", status_str);
}
