import * as v from "valibot";
import { Id } from "../types.ts";
import { createQuery } from "../query.ts";
import { ResourceNotFound } from "../errors.ts";

export default createQuery({
  type: "message:get",
  body: v.required(v.object({
    userId: Id,
    messageId: Id,
  })),
}, async ({ userId, messageId }, { repo, channel }) => {
  const msg = await repo.message.get({
    id: messageId,
  });
  if (!msg) throw new ResourceNotFound("Message not found");
  await channel.access({ userId, id: msg.channelId }).internal();

  return msg;
});
