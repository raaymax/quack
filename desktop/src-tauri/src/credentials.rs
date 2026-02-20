use crate::notifications::Credentials;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "credentials.json";
const KEY_SERVER_URL: &str = "server_url";
const KEY_AUTH_TOKEN: &str = "auth_token";
const KEY_USER_ID: &str = "user_id";

/// Save credentials to the encrypted store
pub fn save(app: &AppHandle, credentials: &Credentials) -> Result<(), String> {
    let store = app
        .store(STORE_FILE)
        .map_err(|e| format!("failed to open store: {}", e))?;

    store.set(
        KEY_SERVER_URL,
        serde_json::Value::String(credentials.server_url.clone()),
    );
    store.set(
        KEY_AUTH_TOKEN,
        serde_json::Value::String(credentials.auth_token.clone()),
    );
    store.set(
        KEY_USER_ID,
        serde_json::Value::String(credentials.user_id.clone()),
    );

    store
        .save()
        .map_err(|e| format!("failed to save store: {}", e))?;

    Ok(())
}

/// Load credentials from the encrypted store
pub fn load(app: &AppHandle) -> Option<Credentials> {
    let store = app.store(STORE_FILE).ok()?;

    let server_url = store.get(KEY_SERVER_URL)?.as_str()?.to_string();
    let auth_token = store.get(KEY_AUTH_TOKEN)?.as_str()?.to_string();
    let user_id = store.get(KEY_USER_ID)?.as_str()?.to_string();

    if server_url.is_empty() || auth_token.is_empty() || user_id.is_empty() {
        return None;
    }

    Some(Credentials {
        server_url,
        auth_token,
        user_id,
    })
}

/// Clear stored credentials
pub fn clear(app: &AppHandle) -> Result<(), String> {
    let store = app
        .store(STORE_FILE)
        .map_err(|e| format!("failed to open store: {}", e))?;

    store.delete(KEY_SERVER_URL);
    store.delete(KEY_AUTH_TOKEN);
    store.delete(KEY_USER_ID);

    store
        .save()
        .map_err(|e| format!("failed to save store: {}", e))?;

    Ok(())
}
