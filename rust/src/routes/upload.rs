use axum::body::Body;
use axum::http::HeaderMap;
use axum::http::header::{CONTENT_DISPOSITION, CONTENT_LENGTH, CONTENT_TYPE};
use futures::{StreamExt, TryStreamExt};

use crate::storage::{ByteStream, UploadOpts};

pub fn header(headers: &HeaderMap, name: axum::http::HeaderName) -> Option<&str> {
    headers.get(name).and_then(|v| v.to_str().ok())
}

pub fn content_type(headers: &HeaderMap) -> String {
    header(headers, CONTENT_TYPE)
        .unwrap_or("application/octet-stream")
        .to_owned()
}

pub fn content_length(headers: &HeaderMap) -> Option<u64> {
    header(headers, CONTENT_LENGTH).and_then(|v| v.parse().ok())
}

pub fn filename(headers: &HeaderMap) -> Option<String> {
    let disposition = header(headers, CONTENT_DISPOSITION)?;
    let lower = disposition.to_ascii_lowercase();
    let start = lower.find("filename")?;
    let mut rest = &disposition[start + "filename".len()..];
    rest = rest.strip_prefix('*').unwrap_or(rest);
    rest = rest.strip_prefix('=')?;
    if rest
        .get(..7)
        .is_some_and(|p| p.eq_ignore_ascii_case("utf-8''"))
    {
        rest = &rest[7..];
    }
    let rest = rest.strip_prefix('"').unwrap_or(rest);
    let raw = rest.split('"').next().unwrap_or_default();
    Some(sanitize(raw))
}

fn sanitize(name: &str) -> String {
    name.chars()
        .map(|c| {
            if matches!(c, '\r' | '\n' | '"' | '\\' | '/') {
                '_'
            } else {
                c
            }
        })
        .take(255)
        .collect()
}

pub fn opts(headers: &HeaderMap, fallback_name: &str) -> UploadOpts {
    UploadOpts {
        filename: filename(headers)
            .filter(|n| !n.is_empty())
            .unwrap_or_else(|| fallback_name.to_owned()),
        content_type: content_type(headers),
        size: content_length(headers),
    }
}

pub fn stream(body: Body) -> ByteStream {
    body.into_data_stream()
        .map_err(std::io::Error::other)
        .boxed()
}
