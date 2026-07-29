import { EntityId } from "../../types.ts";
import { ObjectId } from "./db.ts";

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  if (typeof obj !== "object" || obj === null) return false;
  const proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto === null;
}

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
  if (isPlainObject(obj)) {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      result[key] = recursiveDeserialize(obj[key]);
    }
    if (result._id) {
      result.id = result._id;
      delete result._id;
    }
    return result;
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
  if (obj instanceof ObjectId) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveSerialize);
  }
  if (isPlainObject(obj)) {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      result[key] = recursiveSerialize(obj[key]);
    }
    if (result.id) {
      result._id = result.id;
      delete result.id;
    }
    return result;
  }
  return obj;
}

// deno-lint-ignore no-explicit-any
export function serialize(data: unknown): any {
  return recursiveSerialize(data);
}
