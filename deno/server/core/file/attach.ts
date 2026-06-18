import * as v from "valibot";
import { createCommand } from "../command.ts";
import { Id, IdArr } from "../types.ts";

export default createCommand({
  type: "file:attach",
  body: v.required(
    v.object({
      fileIds: IdArr,
      messageId: Id,
      channelId: Id,
      userId: Id,
    }),
    ["fileIds", "messageId", "channelId", "userId"],
  ),
}, async (data, core) => {
  const { repo, bus } = core;
  if (!data.fileIds.length) return;

  const message = await repo.message.get({ id: data.messageId });
  if (!message) return;
  const channel = await repo.channel.get({ id: data.channelId });
  if (!channel) return;

  for (const fileId of data.fileIds) {
    const file = await repo.file.get({ id: fileId });
    if (!file) continue;
    if (file.channelId.neq(data.channelId)) continue;
    if (file.userId.neq(data.userId)) continue;
    if (file.status === "attached" && file.messageId?.eq(data.messageId)) {
      continue;
    }

    await repo.file.update({ id: fileId }, {
      status: "attached",
      messageId: data.messageId,
      createdAt: message.createdAt,
    });

    const updated = await repo.file.get({ id: fileId });
    bus.group(channel.users, { type: "file", ...updated });
  }
});
