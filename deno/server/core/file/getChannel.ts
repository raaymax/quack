import * as v from "valibot";
import { createQuery } from "../query.ts";
import { Id } from "../types.ts";
import { toClientFile } from "./clientFile.ts";

export default createQuery({
  type: "file:getChannel",
  body: v.object({
    userId: Id,
    channelId: Id,
  }),
}, async ({ userId, channelId }, core) => {
  const channel = await core.channel.access({ id: channelId, userId })
    .internal();
  const files = await core.repo.file.getChannelFiles(channel.id);
  return files.map(toClientFile);
});
