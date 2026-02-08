import * as v from "valibot";
import { EntityId } from "../types.ts";
import type { Core } from "./core.ts";
import { AppError } from "./errors.ts";

function serialize<A>(obj: A): any {
  if (obj instanceof EntityId) {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serialize);
  }
  if (typeof obj === "object") {
    for (const key in obj) {
      obj[key] = serialize(obj[key]);
    }
  }
  return obj;
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
    then(
      onfulfilled: (value: void | EntityId | string | null) => any,
      onrejected: (reason: any) => any,
    ) {
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
  return events.reduce((acc, curr) => {
    acc[curr.type] = curr;
    return acc;
  }, {} as any);
}

export type EventFrom<T> = T extends Command<infer T, infer U>
  ? { type: T; body: v.InferInput<U> }
  : never;
