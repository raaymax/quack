import * as v from "valibot";
import { hash, verify } from "@ts-rex/bcrypt";
import { createCommand } from "../command.ts";
import { AccessDenied, ResourceNotFound } from "../errors.ts";
import { Id } from "../types.ts";
import { ChannelType } from "../../types.ts";

export default createCommand({
  type: "readReceipt:update",
  body: v.object({
    userId: Id,
    messageId: Id,
  }),
}, async ({ userId, messageId }, core) => {
  const { repo, bus } = core;
  const message = await repo.message.get({ id: messageId });
  if (!message) {
    throw new ResourceNotFound("Message not found");
  }
  const parentId = message.parentId ?? null;
  const { channelId } = message;

  const channel = await core.channel.access({ id: message.channelId, userId })
    .internal();

  const data = {
    lastMessageId: message.id,
    lastRead: message.createdAt,
    count: await repo.message.count({
      after: new Date(new Date(message.createdAt).getTime() + 1),
      channelId: message.channelId,
      parentId,
    }),
  };

  const lastRead = message.createdAt;
  const progress = await repo.badge.get({ channelId, parentId, userId });
  if (progress && progress.lastRead > lastRead) return;

  if (!progress) {
    await repo.badge.create({
      channelId,
      parentId,
      userId,
      ...data,
    });
  } else {
    await repo.badge.update({ id: progress.id }, data);
  }

  const myProgress = await repo.badge.get({ channelId, parentId, userId });
  bus.group(channel.users, { type: "badge", ...myProgress });
  return myProgress?.id;
});
