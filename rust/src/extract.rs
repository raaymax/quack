use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::{FromRequest, FromRequestParts, Request};
use axum::http::request::Parts;
use serde::de::DeserializeOwned;
use serde_json::Value;

use crate::error::AppError;

pub trait Required {
    const FIELDS: &'static [&'static str] = &[];
}

#[macro_export]
macro_rules! required {
    ($t:ty $(, $field:literal)* $(,)?) => {
        impl $crate::extract::Required for $t {
            const FIELDS: &'static [&'static str] = &[$($field),*];
        }
    };
}

pub struct Body<T>(pub T);

impl<S: Send + Sync, T: DeserializeOwned + Required> FromRequest<S> for Body<T> {
    type Rejection = AppError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let axum::Json(value) = axum::Json::<Value>::from_request(req, state)
            .await
            .map_err(json_rejection)?;
        if let Value::Object(map) = &value {
            let missing: Vec<&str> = T::FIELDS
                .iter()
                .copied()
                .filter(|f| !map.contains_key(*f))
                .collect();
            if !missing.is_empty() {
                return Err(AppError::missing_fields(&missing));
            }
        }
        serde_json::from_value(value).map(Body).map_err(|e| {
            let text = e.to_string();
            match missing_field(&text) {
                Some(field) => AppError::missing_fields(&[field]),
                None => AppError::invalid_field("", text),
            }
        })
    }
}

fn json_rejection(rejection: JsonRejection) -> AppError {
    AppError::invalid_field("", rejection.body_text())
}

fn missing_field(text: &str) -> Option<&str> {
    let start = text.find("missing field `")? + "missing field `".len();
    let len = text[start..].find('`')?;
    Some(&text[start..start + len])
}

pub struct Query<T>(pub T);

impl<S: Send + Sync, T: DeserializeOwned> FromRequestParts<S> for Query<T> {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        match axum::extract::Query::<T>::from_request_parts(parts, state).await {
            Ok(axum::extract::Query(value)) => Ok(Query(value)),
            Err(rejection) => Err(query_rejection(rejection)),
        }
    }
}

fn query_rejection(rejection: QueryRejection) -> AppError {
    AppError::invalid_field("/querystring", rejection.body_text())
}

pub fn query_number(name: &str, value: Option<&str>) -> Result<Option<i64>, AppError> {
    value
        .map(|v| {
            v.parse::<f64>().map(|n| n as i64).map_err(|_| {
                AppError::invalid_field(&format!("/querystring/{name}"), "must be number")
            })
        })
        .transpose()
}

pub fn query_bool(name: &str, value: Option<&str>) -> Result<Option<bool>, AppError> {
    match value {
        None => Ok(None),
        Some("true" | "1") => Ok(Some(true)),
        Some("false" | "0" | "") => Ok(Some(false)),
        Some(_) => Err(AppError::invalid_field(
            &format!("/querystring/{name}"),
            "must be boolean",
        )),
    }
}

pub fn query_float(name: &str, value: Option<&str>) -> Result<Option<f64>, AppError> {
    value
        .map(|v| {
            v.parse::<f64>().map_err(|_| {
                AppError::invalid_field(&format!("/querystring/{name}"), "must be number")
            })
        })
        .transpose()
}
