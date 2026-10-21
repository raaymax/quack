use axum::extract::State;
use axum::routing::post;
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::{Value, json};

use crate::auth::Auth;
use crate::commands::{self, Invocation};
use crate::doc::oid;
use crate::error::{AppError, AppResult};
use crate::extract::Body;
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/execute", post(execute))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Context {
    channel_id: Option<String>,
    parent_id: Option<String>,
    app_version: Option<String>,
}

#[derive(Deserialize)]
struct Execute {
    name: String,
    text: String,
    context: Context,
}

crate::required!(Execute, "name", "text", "context");

async fn execute(
    State(state): State<AppState>,
    auth: Auth,
    Body(body): Body<Execute>,
) -> AppResult<Json<Value>> {
    let channel_id = body
        .context
        .channel_id
        .as_deref()
        .ok_or_else(|| AppError::missing_field("context/channelId"))?;
    let call = Invocation {
        user_id: auth.user_id,
        text: body.text,
        channel_id: oid(channel_id)?,
        parent_id: body.context.parent_id.as_deref().map(oid).transpose()?,
        app_version: body.context.app_version,
    };
    let name = body.name.strip_prefix('/').unwrap_or(&body.name);
    let data = commands::execute(&state, name, call).await?;
    Ok(Json(json!({ "status": "ok", "data": data })))
}
