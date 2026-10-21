use bson::oid::ObjectId;
use bson::{Bson, DateTime, Document};
use serde_json::{Map, Number, Value};

use crate::error::{AppError, AppResult};

pub fn to_json(value: &Bson) -> Value {
    match value {
        Bson::ObjectId(id) => Value::String(id.to_hex()),
        Bson::DateTime(dt) => Value::String(iso(*dt)),
        Bson::Document(doc) => doc_to_json(doc),
        Bson::Array(items) => Value::Array(items.iter().map(to_json).collect()),
        Bson::String(s) => Value::String(s.clone()),
        Bson::Boolean(b) => Value::Bool(*b),
        Bson::Int32(n) => Value::from(*n),
        Bson::Int64(n) => Value::from(*n),
        Bson::Double(n) => Number::from_f64(*n)
            .map(Value::Number)
            .unwrap_or(Value::Null),
        Bson::Null | Bson::Undefined => Value::Null,
        other => other.clone().into_relaxed_extjson(),
    }
}

pub fn doc_to_json(doc: &Document) -> Value {
    let mut map = Map::with_capacity(doc.len());
    for (key, value) in doc {
        let key = if key == "_id" { "id" } else { key.as_str() };
        map.insert(key.to_owned(), to_json(value));
    }
    Value::Object(map)
}

pub fn docs_to_json(docs: &[Document]) -> Value {
    Value::Array(docs.iter().map(doc_to_json).collect())
}

pub fn iso(dt: DateTime) -> String {
    dt.to_chrono().format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string()
}

pub fn from_json(value: &Value) -> Bson {
    match value {
        Value::Null => Bson::Null,
        Value::Bool(b) => Bson::Boolean(*b),
        Value::Number(n) => match n.as_i64() {
            Some(i) if i32::try_from(i).is_ok() => Bson::Int32(i as i32),
            Some(i) => Bson::Int64(i),
            None => Bson::Double(n.as_f64().unwrap_or_default()),
        },
        Value::String(s) => Bson::String(s.clone()),
        Value::Array(items) => Bson::Array(items.iter().map(from_json).collect()),
        Value::Object(map) => {
            Bson::Document(map.iter().map(|(k, v)| (k.clone(), from_json(v))).collect())
        }
    }
}

pub fn oid(value: &str) -> AppResult<ObjectId> {
    ObjectId::parse_str(value)
        .map_err(|_| AppError::invalid_field("", format!("invalid id: {value}")))
}

pub fn oids(values: &[String]) -> AppResult<Vec<ObjectId>> {
    values.iter().map(|v| oid(v)).collect()
}

pub fn is_entity_id(value: &str) -> bool {
    value.len() == 24 && value.bytes().all(|b| b.is_ascii_hexdigit())
}

pub trait DocExt {
    fn oid(&self, key: &str) -> Option<ObjectId>;
    fn str(&self, key: &str) -> Option<&str>;
    fn flag(&self, key: &str) -> bool;
    fn oid_list(&self, key: &str) -> Vec<ObjectId>;
}

impl DocExt for Document {
    fn oid(&self, key: &str) -> Option<ObjectId> {
        self.get_object_id(key).ok()
    }

    fn str(&self, key: &str) -> Option<&str> {
        self.get_str(key).ok()
    }

    fn flag(&self, key: &str) -> bool {
        self.get_bool(key).unwrap_or(false)
    }

    fn oid_list(&self, key: &str) -> Vec<ObjectId> {
        self.get_array(key)
            .map(|items| items.iter().filter_map(Bson::as_object_id).collect())
            .unwrap_or_default()
    }
}

pub fn id(doc: &Document) -> ObjectId {
    doc.get_object_id("_id").expect("document without _id")
}
