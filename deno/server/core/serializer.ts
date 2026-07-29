import { EntityId } from "../types.ts";

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  if (typeof obj !== "object" || obj === null) return false;
  const proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto === null;
}

function recursiveSerialize(obj: unknown): unknown {
  if (obj instanceof EntityId) {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveSerialize);
  }
  if (isPlainObject(obj)) {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      result[key] = recursiveSerialize(obj[key]);
    }
    return result;
  }
  return obj;
}

export function serialize<A>(obj: A): A {
  return recursiveSerialize(obj) as A;
}
