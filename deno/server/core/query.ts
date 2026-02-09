import * as v from "valibot";
import { EntityId } from "../types.ts";
import type { Core } from "./core.ts";
import { AppError } from "./errors.ts";
import { serialize } from "./serializer.ts";

export type Event = {
  type: string;
  body: unknown;
};
export type Definition = {
  type: string;
  body: v.GenericSchema<any, any, any>;
};

export function createQuery<A extends Definition, B>(
  def: A,
  fn: (body: v.InferOutput<A["body"]>, core: Core) => Promise<B>,
) {
  const handler = (core: Core) => {
    const exec = (body: v.InferInput<A["body"]>) => {
      try {
        const args = v.parse(def.body, body);
        const ret = fn(args, core);
        // console.log(`[QUERY: ${def.type}] Ret: `, r)
        return ret;
      } catch (err) {
        if (err instanceof AppError) {
          throw err;
        }
        console.log(`[QUERY: ${def.type}] Error:`);
        console.log(err);
        throw err;
      }
    };

    return (body: v.InferInput<A["body"]>) => ({
      async internal() {
        return await exec(body);
      },
      then<TResult1 = B, TResult2 = never>(
        onfulfilled: (value: B) => TResult1 | PromiseLike<TResult1>,
        onrejected: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
      ): PromiseLike<TResult1 | TResult2> {
        return exec(body).then((ret) => serialize(ret)).then(
          onfulfilled,
          onrejected,
        );
      },
    });
  };
  handler.def = def;
  handler.accepts = (evt: Event) => evt.type === def.type;
  return handler;
}
