import * as v from "valibot";
import { createCommand } from "../command.ts";
import { Id } from "../types.ts";
import { Badge } from "../../types.ts";

export default createCommand({
  type: "readReceipt:update:message",
  body: v.object({
    channelId: Id,
    parentId: v.optional(Id),
    messageId: Id,
    userId: Id,
  }),
}, async ({ userId, messageId, channelId, parentId }, core) => {
  const { repo, bus } = core;
  const channel = await repo.channel.get({ id: channelId });
  if (!channel) {
    // eslint-disable-next-line no-console
    console.debug("read-receipt update: channel not found", channelId);
    return;
  }
  const message = await repo.message.get({ id: messageId });
  if (!message) {
    // eslint-disable-next-line no-console
    console.debug("read-receipt update:  message not found", messageId);
    return;
  }
  await repo.badge.increment({ channelId, parentId });
  const other = await repo.badge.getAll({ channelId, parentId });
  other.filter((badge: Badge) => badge.userId !== userId).forEach(
    (badge: Badge) => {
      bus.direct(badge.userId, { type: "readReceipt", ...badge });
    },
  );
  const lastRead = message.createdAt;

  const data = {
    userId,
    channelId,
    parentId,
    lastMessageId: messageId,
    lastRead: message.createdAt,
    count: 0,
  };

  const progress = await repo.badge.get({ channelId, parentId, userId });
  if (progress && progress.lastRead > lastRead) return;
  if (!progress) {
    await repo.badge.create(data);
  } else {
    await repo.badge.update({ id: progress.id }, data);
  }
  const badge = await repo.badge.get({ channelId, parentId, userId });
  bus.group(channel.users, { type: "readReceipt", ...badge });
});
