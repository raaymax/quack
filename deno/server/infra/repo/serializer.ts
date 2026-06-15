import { EntityId } from "../../types.ts";
import { ObjectId } from "./db.ts";

// deno-lint-ignore no-explicit-any
function recursiveDeserialize(obj: unknown): any {
  if (obj instanceof EntityId) {
    return EntityId.from(obj);
  }
  if (obj instanceof ObjectId) {
    return EntityId.from(obj.toHexString());
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveDeserialize);
  }
  if (typeof obj === "object" && obj !== null) {
    const record = obj as Record<string, unknown>;
    for (const key in record) {
      record[key] = recursiveDeserialize(record[key]);
    }
    if (record._id) {
      record.id = record._id;
      delete record._id;
    }
  }
  return obj;
}

// deno-lint-ignore no-explicit-any
export function deserialize(data: unknown): any {
  return recursiveDeserialize(data);
}

// deno-lint-ignore no-explicit-any
function recursiveSerialize(obj: unknown): any {
  if (obj instanceof EntityId) {
    return new ObjectId(obj.value);
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveSerialize);
  }
  if (typeof obj === "object" && obj !== null) {
    const record = obj as Record<string, unknown>;
    for (const key in record) {
      record[key] = recursiveSerialize(record[key]);
    }
    if (record.id) {
      record._id = record.id;
      delete record.id;
    }
  }
  return obj;
}

// deno-lint-ignore no-explicit-any
export function serialize(data: unknown): any {
  return recursiveSerialize(data);
}
