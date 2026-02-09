import * as v from "valibot";
import { EntityId } from "../types.ts";
import type { Core } from "./core.ts";
import { AppError } from "./errors.ts";

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

function serialize<A>(obj: A): A {
  return recursiveSerialize(obj) as A;
}

export type Definition<
  T extends string,
  U extends v.GenericSchema<any, any, any>,
> = {
  type: T;
  body: U;
};

export type Handler<U extends v.GenericSchema<any, any, any>> = (
  body: v.InferOutput<U>,
  core: Core,
) => Promise<void | EntityId | string | null>;

export type Command<
  T extends string,
  U extends v.GenericSchema<any, any, any>,
> = {
  type: T;
  def: Definition<T, U>;
  handler: (
    evt: v.InferInput<U>,
    core: Core,
  ) => PromiseLike<void | EntityId | string | null> & {
    internal(): Promise<void | EntityId | string | null>;
  };
};

export function createCommand<
  T extends string,
  U extends v.GenericSchema<any, any, any>,
>(def: Definition<T, U>, fn: Handler<U>): Command<T, U> {
  const exec = async (rawbody: v.InferInput<U>, core: Core) => {
    try {
      const body = v.parse(def.body, rawbody);
      const ret = await core.repo.db.withTransaction(() => fn(body, core));
      // console.log(`[COMMAND: ${def.type}] Ret: `, r)
      return ret;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      console.log(`[COMMAND: ${def.type}] Error:`);
      console.log(err);
      throw err;
    }
  };

  const handler = (body: v.InferInput<U>, core: Core) => ({
    internal() {
      return exec(body, core);
    },
    then<TResult1 = void | EntityId | string | null, TResult2 = never>(
      onfulfilled: (
        value: void | EntityId | string | null,
      ) => TResult1 | PromiseLike<TResult1>,
      onrejected: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
    ): PromiseLike<TResult1 | TResult2> {
      return exec(body, core).then((r) => serialize(r)).then(
        onfulfilled,
        onrejected,
      );
    },
  });

  return {
    type: def.type,
    def,
    handler,
  };
}

export type CommandDirectory<T extends { type: string }[]> = {
  [K in T[number]["type"]]: Extract<T[number], { type: K }>;
};

export function buildCommandCollection<T extends { type: string }[]>(
  events: T,
): CommandDirectory<T> {
  const result: Record<string, T[number]> = {};
  for (const curr of events) {
    result[curr.type] = curr;
  }
  return result as CommandDirectory<T>;
}

export type EventFrom<T> = T extends Command<infer T, infer U>
  ? { type: T; body: v.InferInput<U> }
  : never;
