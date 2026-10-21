use std::ops::Deref;
use std::sync::Arc;

use crate::bus::Bus;
use crate::commands::Commands;
use crate::config::Config;
use crate::db::Db;
use crate::events::Events;
use crate::storage::Storage;
use tokio_util::sync::CancellationToken;

pub struct Inner {
    pub config: Config,
    pub db: Db,
    pub bus: Bus,
    pub events: Events,
    pub storage: Storage,
    pub commands: Commands,
    pub shutdown: CancellationToken,
}

#[derive(Clone)]
pub struct AppState(Arc<Inner>);

impl AppState {
    pub fn new(config: Config, db: Db, storage: Storage, commands: Commands) -> Self {
        Self(Arc::new(Inner {
            config,
            db,
            bus: Bus::default(),
            events: Events::default(),
            storage,
            commands,
            shutdown: CancellationToken::new(),
        }))
    }
}

impl Deref for AppState {
    type Target = Inner;

    fn deref(&self) -> &Inner {
        &self.0
    }
}
