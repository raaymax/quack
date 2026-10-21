import * as v from "valibot";
import { createCommand } from "../command.ts";
import { Id } from "../types.ts";
import { NotOwner, ResourceNotFound } from "../errors.ts";
import { toClientFile } from "./clientFile.ts";

export default createCommand({
  type: "file:attachToChannel",
  body: v.required(
    v.object({
      fileId: Id,
      channelId: Id,
      userId: Id,
    }),
    ["fileId", "channelId", "userId"],
  ),
}, async (data, core) => {
  const { repo, bus } = core;
  const channel = await core.channel.access({
    id: data.channelId,
    userId: data.userId,
  }).internal();

  const file = await repo.file.get({ id: data.fileId });
  if (!file || file.channelId.neq(data.channelId)) {
    throw new ResourceNotFound("File not found");
  }
  if (file.userId.neq(data.userId)) throw new NotOwner();
  if (file.status === "attached") return;
  if (file.status !== "draft") throw new ResourceNotFound("File not found");

  await repo.file.update({ id: data.fileId }, { status: "attached" });

  const updated = await repo.file.get({ id: data.fileId });
  if (!updated) throw new ResourceNotFound("File not found");
  bus.group(channel.users, { type: "file", ...toClientFile(updated) });
});
