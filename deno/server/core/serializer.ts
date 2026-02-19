import { EntityId } from "../types.ts";

function recursiveSerialize(obj: unknown): unknown {
  if (obj instanceof EntityId) {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveSerialize);
  }
  if (typeof obj === "object" && obj !== null) {
    const record = obj as Record<string, unknown>;
    for (const key in record) {
      record[key] = recursiveSerialize(record[key]);
    }
  }
  return obj;
}

export function serialize<A>(obj: A): A {
  return recursiveSerialize(obj) as A;
}
