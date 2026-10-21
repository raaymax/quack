use std::path::PathBuf;

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum StorageConfig {
    Fs { directory: PathBuf },
    Gcs { bucket: String },
    Memory,
}

#[derive(Debug, Clone, Deserialize)]
pub struct WebhookConfig {
    pub url: String,
    #[serde(default)]
    pub events: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FileConfig {
    port: Option<u16>,
    database_url: Option<String>,
    base_url: Option<String>,
    storage: Option<StorageConfig>,
    #[serde(default)]
    webhooks: Vec<WebhookConfig>,
    public_dir: Option<PathBuf>,
    #[serde(default)]
    plugins: PluginsConfig,
}

#[derive(Debug, Clone, Default, Deserialize)]
struct PluginsConfig {
    giphy: Option<GiphyConfig>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GiphyConfig {
    api_key: String,
}

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    pub database_url: String,
    pub base_url: String,
    pub storage: StorageConfig,
    pub webhooks: Vec<WebhookConfig>,
    pub public_dir: PathBuf,
    pub app_version: Option<String>,
    pub giphy_api_key: Option<String>,
}

const DEFAULT_DATABASE_URL: &str = "mongodb://chat:chat@localhost:27017/chat?authSource=admin";

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        let path = std::env::var("CONFIG").unwrap_or_else(|_| "chat.config.json".into());
        let file: Option<FileConfig> = match std::fs::read_to_string(&path) {
            Ok(text) => Some(serde_json::from_str(&text)?),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => None,
            Err(e) => return Err(e.into()),
        };
        let env = |key: &str| std::env::var(key).ok().filter(|v| !v.is_empty());

        let port = match env("PORT") {
            Some(p) => p.parse()?,
            None => file.as_ref().and_then(|f| f.port).unwrap_or(4001),
        };
        let database_url = env("DATABASE_URL")
            .or_else(|| file.as_ref().and_then(|f| f.database_url.clone()))
            .unwrap_or_else(|| DEFAULT_DATABASE_URL.into());
        let base_url = env("BASE_URL")
            .or_else(|| file.as_ref().and_then(|f| f.base_url.clone()))
            .unwrap_or_else(|| format!("http://localhost:{port}"));
        let storage = match env("STORAGE_TYPE").as_deref() {
            Some("fs") => StorageConfig::Fs {
                directory: env("STORAGE_DIRECTORY")
                    .unwrap_or_else(|| "uploads".into())
                    .into(),
            },
            Some("gcs") => StorageConfig::Gcs {
                bucket: env("STORAGE_BUCKET")
                    .ok_or_else(|| anyhow::anyhow!("STORAGE_BUCKET is required for gcs storage"))?,
            },
            Some("memory") => StorageConfig::Memory,
            Some(other) => anyhow::bail!("unknown STORAGE_TYPE: {other}"),
            None => file
                .as_ref()
                .and_then(|f| f.storage.clone())
                .unwrap_or(StorageConfig::Fs {
                    directory: "uploads".into(),
                }),
        };
        let public_dir = env("PUBLIC_DIR")
            .map(PathBuf::from)
            .or_else(|| file.as_ref().and_then(|f| f.public_dir.clone()))
            .unwrap_or_else(|| "app/dist".into());

        let giphy_api_key = env("GIPHY_API_KEY").or_else(|| {
            file.as_ref()
                .and_then(|f| f.plugins.giphy.as_ref())
                .map(|g| g.api_key.clone())
        });

        Ok(Self {
            port,
            database_url,
            base_url,
            storage,
            webhooks: file.map(|f| f.webhooks).unwrap_or_default(),
            public_dir,
            app_version: env("APP_VERSION"),
            giphy_api_key,
        })
    }

    pub fn secure_cookies(&self) -> bool {
        self.base_url.starts_with("https")
    }
}
