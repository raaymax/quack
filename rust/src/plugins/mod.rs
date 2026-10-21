use std::sync::Arc;

use crate::commands::Commands;
use crate::config::Config;
use crate::state::AppState;

pub mod giphy;

pub struct Plugins {
    giphy: Option<Arc<giphy::Giphy>>,
}

impl Plugins {
    pub fn load(config: &Config) -> Self {
        Self {
            giphy: config
                .giphy_api_key
                .clone()
                .map(|key| Arc::new(giphy::Giphy::new(key))),
        }
    }

    pub fn commands(&self) -> Commands {
        let mut commands = crate::commands::builtin();
        if let Some(giphy) = &self.giphy {
            commands.push(giphy.clone());
        }
        commands
    }

    pub fn start(&self, state: &AppState) {
        if let Some(giphy) = &self.giphy {
            giphy.clone().listen(state.clone());
        }
    }
}
