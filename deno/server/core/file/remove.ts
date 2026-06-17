import * as v from "valibot";
import { createCommand } from "../command.ts";
import { Id } from "../types.ts";
import { NotOwner, ResourceNotFound } from "../errors.ts";

export default createCommand({
  type: "file:remove",
  body: v.required(v.object({
    fileId: Id,
    userId: Id,
  })),
}, async ({ fileId, userId }, core) => {
  const { repo, bus, storage } = core;
  const file = await repo.file.get({ id: fileId });
  if (!file) throw new ResourceNotFound("File not found");
  if (file.uploaderId.neq(userId)) throw new NotOwner();

  await repo.file.update({ id: fileId }, {
    status: "deleted",
    messageId: null,
  });

  const stillReferenced = await repo.file.count({
    storageId: file.storageId,
    status: "attached",
  });
  if (stillReferenced === 0) {
    await storage.remove(file.storageId);
  }

  const channel = await repo.channel.get({ id: file.channelId });
  bus.group(channel?.users ?? [], {
    type: "file:removed",
    id: fileId,
    channelId: file.channelId,
  });
});
