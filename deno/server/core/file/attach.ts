import * as v from "valibot";
import { createCommand } from "../command.ts";
import { Id, IdArr } from "../types.ts";
import { NotOwner, ResourceNotFound } from "../errors.ts";
import { toClientFile } from "./clientFile.ts";

export default createCommand({
  type: "file:attach",
  body: v.required(
    v.object({
      fileIds: IdArr,
      channelId: Id,
      userId: Id,
    }),
    ["fileIds", "channelId", "userId"],
  ),
}, async (data, core) => {
  const { repo, bus } = core;
  if (!data.fileIds.length) return;

  const channel = await repo.channel.get({ id: data.channelId });
  if (!channel) throw new ResourceNotFound("Channel not found");

  const files = await repo.file.getManyByIds(data.fileIds);
  const byId = new Map(files.map((f) => [f.id.toString(), f]));
  const drafts = data.fileIds.map((fileId) => {
    const file = byId.get(fileId.toString());
    if (
      !file || file.channelId.neq(data.channelId) || file.status === "deleted"
    ) {
      throw new ResourceNotFound("File not found");
    }
    if (file.status === "draft" && file.userId.neq(data.userId)) {
      throw new NotOwner();
    }
    return file;
  }).filter((file) => file.status === "draft");

  for (const file of drafts) {
    await repo.file.update({ id: file.id }, { status: "attached" });
    bus.group(channel.users, {
      type: "file",
      ...toClientFile({ ...file, status: "attached" }),
    });
  }
});
