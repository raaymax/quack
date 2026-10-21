use serde_json::Value;
use tokio::sync::broadcast;

#[derive(Debug, Clone)]
pub enum DomainEvent {
    MessageCreated(Value),
    MessageUpdated(Value),
    MessageInteraction(Value),
}

#[derive(Clone)]
pub struct Events {
    tx: broadcast::Sender<DomainEvent>,
}

impl Default for Events {
    fn default() -> Self {
        Self {
            tx: broadcast::channel(1024).0,
        }
    }
}

impl Events {
    pub fn subscribe(&self) -> broadcast::Receiver<DomainEvent> {
        self.tx.subscribe()
    }

    pub fn message_created(&self, message: Value) {
        let _ = self.tx.send(DomainEvent::MessageCreated(message));
    }

    pub fn message_updated(&self, message: Value) {
        let _ = self.tx.send(DomainEvent::MessageUpdated(message));
    }

    pub fn interaction(&self, payload: Value) {
        let _ = self.tx.send(DomainEvent::MessageInteraction(payload));
    }
}
