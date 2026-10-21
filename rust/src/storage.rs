use std::collections::HashMap;
use std::io::Cursor;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

use bytes::{Bytes, BytesMut};
use futures::stream::{self, BoxStream};
use futures::{StreamExt, TryStreamExt};
use object_store::gcp::{GoogleCloudStorage, GoogleCloudStorageBuilder};
use object_store::path::Path as ObjectPath;
use object_store::{
    Attribute, Attributes, GetOptions, ObjectStore, ObjectStoreExt, PutOptions, PutPayload,
};
use serde::{Deserialize, Serialize};
use tokio::io::AsyncWriteExt;
use tokio::sync::{Mutex, Semaphore};

use crate::config::StorageConfig;

const MAX_RESIZE_BYTES: u64 = 25 * 1024 * 1024;
const MAX_DIMENSION: u32 = 2048;
const GCS_BUFFER_LIMIT_BYTES: u64 = 64 * 1024 * 1024;

pub type ByteStream = BoxStream<'static, std::io::Result<Bytes>>;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileMeta {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub filename: String,
    pub content_type: String,
    #[serde(default)]
    pub size: u64,
    #[serde(default)]
    pub resolution: Option<Resolution>,
}

pub struct FileData {
    pub meta: FileMeta,
    pub body: ByteStream,
}

pub struct UploadOpts {
    pub filename: String,
    pub content_type: String,
    pub size: Option<u64>,
}

#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("file not found")]
    NotFound,
    #[error("size mismatch")]
    SizeMismatch,
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    ObjectStore(#[from] object_store::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}

impl From<StorageError> for crate::error::AppError {
    fn from(e: StorageError) -> Self {
        match e {
            StorageError::NotFound => Self::new(
                axum::http::StatusCode::NOT_FOUND,
                "FILE_NOT_FOUND",
                "File not found",
            ),
            other => {
                tracing::error!(error = %other, "storage error");
                Self::internal("Internal Server Error")
            }
        }
    }
}

type Result<T> = std::result::Result<T, StorageError>;

enum Backend {
    Fs(PathBuf),
    Memory {
        files: Mutex<HashMap<String, (FileMeta, Bytes)>>,
        next: AtomicU64,
    },
    Gcs(Arc<GoogleCloudStorage>),
}

pub struct Storage {
    backend: Backend,
    images: Semaphore,
}

fn is_inspectable_image(content_type: &str) -> bool {
    content_type == "image/jpeg" || content_type == "image/png"
}

fn clamp(value: Option<f64>) -> u32 {
    match value {
        Some(v) if v > 0.0 => (v.floor() as u32).min(MAX_DIMENSION),
        _ => 0,
    }
}

fn variant_id(id: &str, width: u32, height: u32) -> String {
    format!("{id}-{width}x{height}")
}

fn once(bytes: Bytes) -> ByteStream {
    stream::once(async move { Ok(bytes) }).boxed()
}

impl Storage {
    pub fn new(config: &StorageConfig) -> anyhow::Result<Self> {
        let backend = match config {
            StorageConfig::Fs { directory } => Backend::Fs(directory.clone()),
            StorageConfig::Memory => Backend::Memory {
                files: Mutex::default(),
                next: AtomicU64::new(0),
            },
            StorageConfig::Gcs { bucket } => Backend::Gcs(Arc::new(
                GoogleCloudStorageBuilder::from_env()
                    .with_bucket_name(bucket)
                    .build()?,
            )),
        };
        let workers = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(2);
        Ok(Self {
            backend,
            images: Semaphore::new(workers),
        })
    }

    pub async fn upload(&self, body: ByteStream, opts: UploadOpts) -> Result<(String, FileMeta)> {
        let mut meta = FileMeta {
            id: None,
            filename: opts.filename,
            content_type: opts.content_type,
            size: opts.size.unwrap_or(0),
            resolution: None,
        };
        let inspect = is_inspectable_image(&meta.content_type)
            && opts.size.is_none_or(|s| s <= MAX_RESIZE_BYTES);
        if !inspect {
            return self.store(None, body, meta, opts.size).await;
        }
        let bytes = collect(body).await?;
        if bytes.len() as u64 <= MAX_RESIZE_BYTES {
            meta.resolution = self.resolution(bytes.clone()).await;
        }
        self.store(None, once(bytes), meta, opts.size).await
    }

    pub async fn get(&self, id: &str, width: Option<f64>, height: Option<f64>) -> Result<FileData> {
        let (width, height) = (clamp(width), clamp(height));
        if width == 0 && height == 0 {
            return self.read(id).await;
        }
        let target = variant_id(id, width, height);
        if self.exists(&target).await? {
            return self.read(&target).await;
        }
        let file = self.read(id).await?;
        if file.meta.size > MAX_RESIZE_BYTES || !is_inspectable_image(&file.meta.content_type) {
            return Ok(file);
        }
        let meta = file.meta.clone();
        let original = collect(file.body).await?;
        let Some(resized) = self
            .resize(
                original.clone(),
                width,
                height,
                meta.content_type == "image/png",
            )
            .await
        else {
            return Ok(FileData {
                meta,
                body: once(original),
            });
        };
        let variant = FileMeta {
            id: Some(target.clone()),
            size: resized.len() as u64,
            ..meta
        };
        self.store(Some(target.clone()), once(resized), variant, None)
            .await?;
        self.read(&target).await
    }

    pub async fn remove(&self, id: &str) -> Result<()> {
        self.delete(id).await?;
        for variant in self.list(&format!("{id}-")).await? {
            self.delete(&variant).await?;
        }
        Ok(())
    }

    pub async fn exists(&self, id: &str) -> Result<bool> {
        match &self.backend {
            Backend::Fs(dir) => Ok(tokio::fs::try_exists(dir.join(id)).await?
                && tokio::fs::try_exists(dir.join(format!("{id}.json"))).await?),
            Backend::Memory { files, .. } => Ok(files.lock().await.contains_key(id)),
            Backend::Gcs(store) => match store.head(&ObjectPath::from(id)).await {
                Ok(_) => Ok(true),
                Err(object_store::Error::NotFound { .. }) => Ok(false),
                Err(e) => Err(e.into()),
            },
        }
    }

    async fn resolution(&self, bytes: Bytes) -> Option<Resolution> {
        let _permit = self.images.try_acquire().ok()?;
        tokio::task::spawn_blocking(move || {
            image::ImageReader::new(Cursor::new(bytes))
                .with_guessed_format()
                .ok()?
                .into_dimensions()
                .ok()
                .map(|(width, height)| Resolution { width, height })
        })
        .await
        .ok()
        .flatten()
    }

    async fn resize(&self, bytes: Bytes, width: u32, height: u32, png: bool) -> Option<Bytes> {
        let Ok(_permit) = self.images.try_acquire() else {
            tracing::warn!("resize pool saturated, serving original");
            return None;
        };
        let result =
            tokio::task::spawn_blocking(move || resize_image(&bytes, width, height, png)).await;
        match result {
            Ok(Ok(bytes)) => Some(bytes),
            Ok(Err(e)) => {
                tracing::warn!(error = %e, "thumbnail resize failed, serving original");
                None
            }
            Err(e) => {
                tracing::warn!(error = %e, "thumbnail resize task failed");
                None
            }
        }
    }

    async fn store(
        &self,
        id: Option<String>,
        body: ByteStream,
        mut meta: FileMeta,
        expected: Option<u64>,
    ) -> Result<(String, FileMeta)> {
        match &self.backend {
            Backend::Fs(dir) => {
                let id = id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
                tokio::fs::create_dir_all(dir).await?;
                let mut file = tokio::fs::File::create(dir.join(&id)).await?;
                let mut body = body;
                let mut size = 0u64;
                while let Some(chunk) = body.try_next().await? {
                    size += chunk.len() as u64;
                    file.write_all(&chunk).await?;
                }
                file.flush().await?;
                check_size(expected, size)?;
                meta.size = size;
                tokio::fs::write(dir.join(format!("{id}.json")), serde_json::to_vec(&meta)?)
                    .await?;
                Ok((id, meta))
            }
            Backend::Memory { files, next } => {
                let id =
                    id.unwrap_or_else(|| format!("f-{}", next.fetch_add(1, Ordering::Relaxed)));
                let bytes = collect(body).await?;
                check_size(expected, bytes.len() as u64)?;
                meta.size = bytes.len() as u64;
                files.lock().await.insert(id.clone(), (meta.clone(), bytes));
                Ok((id, meta))
            }
            Backend::Gcs(store) => {
                let id = id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
                let path = ObjectPath::from(id.as_str());
                let attributes = gcs_attributes(&meta)?;
                let known = expected.or((meta.size > 0).then_some(meta.size));
                if known.is_some_and(|s| s <= GCS_BUFFER_LIMIT_BYTES) {
                    let bytes = collect(body).await?;
                    check_size(expected, bytes.len() as u64)?;
                    meta.size = bytes.len() as u64;
                    let opts = PutOptions {
                        attributes,
                        ..Default::default()
                    };
                    store.put_opts(&path, PutPayload::from(bytes), opts).await?;
                } else {
                    let opts = object_store::PutMultipartOptions {
                        attributes,
                        ..Default::default()
                    };
                    let upload = store.put_multipart_opts(&path, opts).await?;
                    let mut writer = object_store::WriteMultipart::new(upload);
                    let mut body = body;
                    let mut size = 0u64;
                    while let Some(chunk) = body.try_next().await? {
                        size += chunk.len() as u64;
                        writer.write(&chunk);
                    }
                    if let Err(e) = check_size(expected, size) {
                        writer.abort().await?;
                        return Err(e);
                    }
                    writer.finish().await?;
                    meta.size = size;
                }
                Ok((id, meta))
            }
        }
    }

    async fn read(&self, id: &str) -> Result<FileData> {
        match &self.backend {
            Backend::Fs(dir) => {
                let meta_text = match tokio::fs::read(dir.join(format!("{id}.json"))).await {
                    Ok(text) => text,
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                        return Err(StorageError::NotFound);
                    }
                    Err(e) => return Err(e.into()),
                };
                let meta: FileMeta = serde_json::from_slice(&meta_text)?;
                let file = match tokio::fs::File::open(dir.join(id)).await {
                    Ok(file) => file,
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                        return Err(StorageError::NotFound);
                    }
                    Err(e) => return Err(e.into()),
                };
                let body = tokio_util::io::ReaderStream::new(file).boxed();
                Ok(FileData { meta, body })
            }
            Backend::Memory { files, .. } => {
                let files = files.lock().await;
                let (meta, bytes) = files.get(id).ok_or(StorageError::NotFound)?;
                Ok(FileData {
                    meta: meta.clone(),
                    body: once(bytes.clone()),
                })
            }
            Backend::Gcs(store) => {
                let result = match store
                    .get_opts(&ObjectPath::from(id), GetOptions::default())
                    .await
                {
                    Ok(result) => result,
                    Err(object_store::Error::NotFound { .. }) => {
                        return Err(StorageError::NotFound);
                    }
                    Err(e) => return Err(e.into()),
                };
                let meta = gcs_meta(id, result.meta.size, &result.attributes);
                let body = result.into_stream().map_err(std::io::Error::other).boxed();
                Ok(FileData { meta, body })
            }
        }
    }

    async fn list(&self, prefix: &str) -> Result<Vec<String>> {
        match &self.backend {
            Backend::Fs(dir) => {
                let mut out = Vec::new();
                let mut entries = match tokio::fs::read_dir(dir).await {
                    Ok(entries) => entries,
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(out),
                    Err(e) => return Err(e.into()),
                };
                while let Some(entry) = entries.next_entry().await? {
                    let name = entry.file_name().to_string_lossy().into_owned();
                    if entry.file_type().await?.is_file()
                        && name.starts_with(prefix)
                        && !name.ends_with(".json")
                    {
                        out.push(name);
                    }
                }
                Ok(out)
            }
            Backend::Memory { files, .. } => Ok(files
                .lock()
                .await
                .keys()
                .filter(|k| k.starts_with(prefix))
                .cloned()
                .collect()),
            Backend::Gcs(store) => {
                let mut objects = store.list_with_offset(None, &ObjectPath::from(prefix));
                let mut out = Vec::new();
                while let Some(object) = objects.try_next().await? {
                    let name = object.location.to_string();
                    if !name.starts_with(prefix) {
                        break;
                    }
                    out.push(name);
                }
                Ok(out)
            }
        }
    }

    async fn delete(&self, id: &str) -> Result<()> {
        match &self.backend {
            Backend::Fs(dir) => {
                for path in [dir.join(id), dir.join(format!("{id}.json"))] {
                    match tokio::fs::remove_file(path).await {
                        Ok(()) => {}
                        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
                        Err(e) => return Err(e.into()),
                    }
                }
                Ok(())
            }
            Backend::Memory { files, .. } => {
                files.lock().await.remove(id);
                Ok(())
            }
            Backend::Gcs(store) => match store.delete(&ObjectPath::from(id)).await {
                Ok(()) | Err(object_store::Error::NotFound { .. }) => Ok(()),
                Err(e) => Err(e.into()),
            },
        }
    }
}

fn check_size(expected: Option<u64>, actual: u64) -> Result<()> {
    match expected {
        Some(expected) if expected > 0 && expected != actual => Err(StorageError::SizeMismatch),
        _ => Ok(()),
    }
}

async fn collect(mut body: ByteStream) -> Result<Bytes> {
    let mut buf = BytesMut::new();
    while let Some(chunk) = body.try_next().await? {
        buf.extend_from_slice(&chunk);
    }
    Ok(buf.freeze())
}

fn gcs_attributes(meta: &FileMeta) -> Result<Attributes> {
    let mut attributes = Attributes::new();
    attributes.insert(Attribute::ContentType, meta.content_type.clone().into());
    attributes.insert(
        Attribute::Metadata("filename".into()),
        meta.filename.clone().into(),
    );
    if let Some(resolution) = &meta.resolution {
        attributes.insert(
            Attribute::Metadata("resolution".into()),
            serde_json::to_string(resolution)?.into(),
        );
    }
    Ok(attributes)
}

fn gcs_meta(id: &str, size: u64, attributes: &Attributes) -> FileMeta {
    let get = |attr: Attribute| attributes.get(&attr).map(|v| v.as_ref().to_owned());
    FileMeta {
        id: Some(id.to_owned()),
        filename: get(Attribute::Metadata("filename".into())).unwrap_or_else(|| "file".into()),
        content_type: get(Attribute::ContentType)
            .unwrap_or_else(|| "application/octet-stream".into()),
        size,
        resolution: get(Attribute::Metadata("resolution".into()))
            .and_then(|r| serde_json::from_str(&r).ok()),
    }
}

fn resize_image(bytes: &[u8], width: u32, height: u32, png: bool) -> anyhow::Result<Bytes> {
    let img = image::load_from_memory(bytes)?;
    let (ow, oh) = (img.width() as f64, img.height() as f64);
    let w = if width == 0 {
        ((ow / oh) * height as f64).round().max(1.0) as u32
    } else {
        width
    };
    let h = if height == 0 {
        ((oh / ow) * w as f64).round().max(1.0) as u32
    } else {
        height
    };
    let out = img.resize_exact(w, h, image::imageops::FilterType::Lanczos3);
    let mut buf = Cursor::new(Vec::new());
    if png {
        out.write_to(&mut buf, image::ImageFormat::Png)?;
    } else {
        let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, 90);
        out.to_rgb8().write_with_encoder(encoder)?;
    }
    Ok(Bytes::from(buf.into_inner()))
}
