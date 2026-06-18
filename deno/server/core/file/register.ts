import * as v from "valibot";
import { createCommand } from "../command.ts";
import { Id } from "../types.ts";

export default createCommand({
  type: "file:register",
  body: v.required(
    v.object({
      channelId: Id,
      userId: Id,
      storageId: v.string(),
      fileName: v.string(),
      contentType: v.optional(v.string(), "application/octet-stream"),
      size: v.optional(v.union([v.number(), v.null()]), null),
      resolution: v.optional(
        v.union([
          v.object({ width: v.number(), height: v.number() }),
          v.null(),
        ]),
        null,
      ),
    }),
    ["channelId", "userId", "storageId", "fileName"],
  ),
}, async (data, core) => {
  const { repo } = core;
  const channel = await core.channel.access({
    id: data.channelId,
    userId: data.userId,
  }).internal();

  const id = await repo.file.create({
    storageId: data.storageId,
    channelId: channel.id,
    userId: data.userId,
    fileName: data.fileName,
    contentType: data.contentType,
    size: data.size,
    resolution: data.resolution,
    status: "draft",
    messageId: null,
    createdAt: new Date(),
  });

  return id;
});
