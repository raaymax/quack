import * as v from "valibot";
import { Id } from "../types.ts";
import { createQuery } from "../query.ts";
import { resolveFiles } from "../file/resolveFiles.ts";

export default createQuery({
  type: "message:getAll",
  body: v.required(v.object({
    userId: Id,
    query: v.object({
      channelId: Id,
      parentId: v.optional(v.union([Id, v.null_()])),
      pinned: v.optional(v.boolean()),
      before: v.optional(v.pipe(v.string(), v.transform((v) => new Date(v)))),
      after: v.optional(v.pipe(v.string(), v.transform((v) => new Date(v)))),
      limit: v.optional(v.number()),
      offset: v.optional(v.number()),
      order: v.optional(v.union([v.literal(1), v.literal(-1)])),
      search: v.optional(v.string()),
    }),
  })),
}, async ({ userId, query: msg }, core) => {
  const { repo } = core;
  const { channelId, parentId } = msg;

  await core.channel.access({ id: channelId, userId }).internal();

  const msgs = await repo.message.getAll({
    channelId,
    parentId,
    before: msg.before,
    after: msg.after,
    search: msg.search,
    ...(msg.pinned ? { pinned: msg.pinned } : {}),
  }, {
    offset: msg.offset,
    limit: msg.limit,
    order: msg.order ?? (msg.after ? 1 : -1),
  });

  if (msg.after) msgs.reverse();

  if (parentId) {
    const parent = await repo.message.get({
      id: parentId,
      channelId,
    });
    const result = [parent, ...msgs];
    await resolveFiles(repo, result);
    return result;
  }
  await resolveFiles(repo, msgs);
  return msgs;
});
