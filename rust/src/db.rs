use bson::Document;
use mongodb::{Client, Collection, Database};

#[derive(Clone)]
pub struct Db {
    db: Database,
}

impl Db {
    pub async fn connect(url: &str) -> anyhow::Result<Self> {
        let client = Client::with_uri_str(url).await?;
        let db = client
            .default_database()
            .ok_or_else(|| anyhow::anyhow!("database url must include a database name"))?;
        Ok(Self { db })
    }

    pub fn database(&self) -> &Database {
        &self.db
    }

    fn col(&self, name: &str) -> Collection<Document> {
        self.db.collection(name)
    }

    pub fn users(&self) -> Collection<Document> {
        self.col("users")
    }

    pub fn sessions(&self) -> Collection<Document> {
        self.col("sessions")
    }

    pub fn channels(&self) -> Collection<Document> {
        self.col("channels")
    }

    pub fn messages(&self) -> Collection<Document> {
        self.col("messages")
    }

    pub fn badges(&self) -> Collection<Document> {
        self.col("badges")
    }

    pub fn invitations(&self) -> Collection<Document> {
        self.col("invitations")
    }

    pub fn emojis(&self) -> Collection<Document> {
        self.col("emojis")
    }

    pub fn files(&self) -> Collection<Document> {
        self.col("files")
    }
}
