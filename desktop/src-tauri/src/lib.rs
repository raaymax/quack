mod credentials;
mod notifications;
mod tray;

use std::sync::Arc;

use notifications::{Credentials, NotificationService};
use tauri::Manager;
use tokio::sync::Mutex;

type ServiceState = Arc<Mutex<NotificationService>>;

#[tauri::command]
async fn start_notification_service(
    app: tauri::AppHandle,
    state: tauri::State<'_, ServiceState>,
    server_url: String,
    auth_token: String,
    user_id: String,
) -> Result<(), String> {
    let creds = Credentials {
        server_url,
        auth_token,
        user_id,
    };

    // Persist credentials for auto-reconnect on next launch
    credentials::save(&app, &creds)?;

    notifications::start(&app, &state, creds).await;
    Ok(())
}

#[tauri::command]
async fn stop_notification_service(
    app: tauri::AppHandle,
    state: tauri::State<'_, ServiceState>,
) -> Result<(), String> {
    notifications::stop(&app, &state).await;
    credentials::clear(&app)?;
    Ok(())
}

#[tauri::command]
async fn get_service_status(state: tauri::State<'_, ServiceState>) -> Result<String, String> {
    let status = notifications::status(&state).await;
    Ok(serde_json::to_string(&status).unwrap_or_else(|_| "\"disconnected\"".to_string()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(NotificationService::new())
        .invoke_handler(tauri::generate_handler![
            start_notification_service,
            stop_notification_service,
            get_service_status,
        ])
        .setup(|app| {
            tray::setup(app.handle())?;

            // Hide window on close (minimize to tray) instead of quitting
            let window = app.get_webview_window("main").unwrap();
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window_clone.hide();
                }
            });

            // Auto-connect if credentials are saved from a previous session
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Some(creds) = credentials::load(&app_handle) {
                    log::info!("Found saved credentials, auto-connecting...");
                    let state: tauri::State<'_, ServiceState> = app_handle.state();
                    notifications::start(&app_handle, &state, creds).await;
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            // On macOS, clicking the dock icon fires Reopen — show the window
            if let tauri::RunEvent::Reopen { .. } = event {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        });
}
