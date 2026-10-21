use std::sync::Arc;

use bson::oid::ObjectId;
use serde_json::{Value, json};
use tokio::sync::broadcast;

#[derive(Debug, Clone)]
pub enum Target {
    User(ObjectId),
    Group {
        users: Vec<ObjectId>,
        except: Option<ObjectId>,
    },
    All,
}

#[derive(Debug, Clone)]
pub struct Envelope {
    pub target: Target,
    pub payload: Arc<Value>,
}

impl Envelope {
    pub fn reaches(&self, user: &ObjectId) -> bool {
        match &self.target {
            Target::User(id) => id == user,
            Target::Group { users, except } => {
                except.as_ref() != Some(user) && users.contains(user)
            }
            Target::All => true,
        }
    }

    pub fn notification(&self) -> Value {
        let mut payload = (*self.payload).clone();
        if let Value::Object(map) = &mut payload {
            match &self.target {
                Target::User(id) => {
                    map.insert("_userId".into(), json!(id.to_hex()));
                }
                Target::Group { users, .. } => {
                    let ids: Vec<String> = users.iter().map(|u| u.to_hex()).collect();
                    map.insert("_userIds".into(), json!(ids));
                }
                Target::All => {}
            }
        }
        payload
    }
}

#[derive(Clone)]
pub struct Bus {
    tx: broadcast::Sender<Envelope>,
}

impl Default for Bus {
    fn default() -> Self {
        Self {
            tx: broadcast::channel(4096).0,
        }
    }
}

impl Bus {
    pub fn subscribe(&self) -> broadcast::Receiver<Envelope> {
        self.tx.subscribe()
    }

    pub fn direct(&self, user: ObjectId, payload: Value) {
        self.send(Target::User(user), "direct", payload);
    }

    pub fn group(&self, users: Vec<ObjectId>, payload: Value, except: Option<ObjectId>) {
        self.send(Target::Group { users, except }, "group", payload);
    }

    pub fn broadcast(&self, payload: Value) {
        self.send(Target::All, "broadcast", payload);
    }

    fn send(&self, target: Target, kind: &str, mut payload: Value) {
        if let Value::Object(map) = &mut payload {
            map.insert("_target".into(), Value::String(kind.into()));
        }
        let _ = self.tx.send(Envelope {
            target,
            payload: Arc::new(payload),
        });
    }
}
