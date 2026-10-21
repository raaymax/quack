use axum::Router;

use crate::state::AppState;

pub mod auth;
pub mod channels;
pub mod commands;
pub mod emojis;
pub mod files;
pub mod interactions;
pub mod messages;
pub mod mobile;
pub mod profile;
pub mod read_receipts;
pub mod static_files;
pub mod system;
pub mod upload;
pub mod users;

pub fn api() -> Router<AppState> {
    Router::new()
        .merge(system::router())
        .nest("/auth", auth::router())
        .nest("/users", users::router())
        .nest("/profile", profile::router())
        .nest("/channels", channels::router())
        .nest(
            "/channels/{channel_id}/messages",
            messages::channel_router(),
        )
        .nest(
            "/channels/{channel_id}/read-receipts",
            read_receipts::channel_router(),
        )
        .nest("/channels/{channel_id}/files", files::channel_router())
        .nest("/files", files::storage_router())
        .nest("/emojis", emojis::router())
        .nest("/messages", messages::router())
        .nest("/commands", commands::router())
        .nest("/interactions", interactions::router())
        .nest("/mobile", mobile::router())
        .nest("/read-receipts", read_receipts::router())
}
