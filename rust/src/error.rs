use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::{Map, Value, json};

#[derive(Debug)]
pub struct AppError {
    pub status: StatusCode,
    pub code: &'static str,
    pub message: String,
    pub extra: Map<String, Value>,
}

pub type AppResult<T> = Result<T, AppError>;

impl AppError {
    pub fn new(status: StatusCode, code: &'static str, message: impl Into<String>) -> Self {
        Self {
            status,
            code,
            message: message.into(),
            extra: Map::new(),
        }
    }

    pub fn with(mut self, key: &str, value: Value) -> Self {
        self.extra.insert(key.into(), value);
        self
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(StatusCode::NOT_FOUND, "RESOURCE_NOT_FOUND", message)
    }

    pub fn access_denied(message: impl Into<String>) -> Self {
        Self::new(StatusCode::UNAUTHORIZED, "ACCESS_DENIED", message)
    }

    pub fn no_access(message: impl Into<String>) -> Self {
        Self::new(StatusCode::FORBIDDEN, "NO_ACCESS", message)
    }

    pub fn not_owner(message: impl Into<String>) -> Self {
        Self::new(StatusCode::FORBIDDEN, "NOT_OWNER", message)
    }

    pub fn conflict(code: &'static str, message: impl Into<String>) -> Self {
        Self::new(StatusCode::CONFLICT, code, message)
    }

    pub fn bad_request(code: &'static str, message: impl Into<String>) -> Self {
        Self::new(StatusCode::BAD_REQUEST, code, message)
    }

    pub fn validation(errors: Vec<Value>) -> Self {
        Self::bad_request("VALIDATION_ERROR", "Validation failed")
            .with("errors", Value::Array(errors))
    }

    pub fn invalid_field(path: &str, message: impl Into<String>) -> Self {
        Self::validation(vec![
            json!({ "instancePath": path, "message": message.into() }),
        ])
    }

    pub fn missing_field(field: &str) -> Self {
        Self::missing_fields(&[field])
    }

    pub fn missing_fields(fields: &[&str]) -> Self {
        Self::validation(
            fields
                .iter()
                .map(|field| {
                    json!({
                        "instancePath": "",
                        "keyword": "required",
                        "params": { "missingProperty": field },
                        "message": format!("must have required property '{field}'"),
                    })
                })
                .collect(),
        )
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_SERVER_ERROR",
            message,
        )
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        if self.status.is_server_error() {
            tracing::error!(code = self.code, message = %self.message, "request failed");
        } else {
            tracing::debug!(code = self.code, message = %self.message, extra = ?self.extra, "request rejected");
        }
        let mut body = self.extra;
        body.insert("errorCode".into(), Value::String(self.code.into()));
        body.insert("message".into(), Value::String(self.message));
        (self.status, Json(Value::Object(body))).into_response()
    }
}

macro_rules! internal_from {
    ($($t:ty),*) => {$(
        impl From<$t> for AppError {
            fn from(e: $t) -> Self {
                tracing::error!(error = ?e, "internal error");
                Self::internal("Internal Server Error")
            }
        }
    )*};
}

internal_from!(
    mongodb::error::Error,
    bson::error::Error,
    anyhow::Error,
    std::io::Error,
    serde_json::Error
);
