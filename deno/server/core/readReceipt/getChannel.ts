import * as v from "valibot";
import { createQuery } from "../query.ts";
import { Id } from "../types.ts";
import { ResourceNotFound } from "../errors.ts";

export default createQuery({
  type: "readReceipt:getChannel",
  body: v.object({
    userId: Id,
    channelId: Id,
    parentId: v.optional(Id),
  }),
}, async ({ userId: _userId, channelId, parentId }, core) => {
  const channel = await core.channel.access({ id: channelId, userId: _userId })
    .internal();
  const all = await core.repo.badge.getAll({ channelId: channel.id, parentId });
  return all;
});
