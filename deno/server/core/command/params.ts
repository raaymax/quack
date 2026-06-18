import * as v from "valibot";
import { Id } from "../types.ts";

export const commandBodyValidator = v.required(
  v.object({
    userId: Id,
    name: v.string(),
    text: v.string(),
    context: v.object({
      channelId: Id,
      appVersion: v.optional(v.string()),
    }),
  }),
  ["name", "text", "context"],
);

export type CommandBody = v.InferOutput<typeof commandBodyValidator>;
