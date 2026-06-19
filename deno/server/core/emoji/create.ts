import * as v from "valibot";
import { createCommand } from "../command.ts";
import { EmojiAlreadyExists } from "../errors.ts";
import { Shortname } from "./shortname.ts";

export default createCommand({
  type: "emoji:create",
  body: v.required(
    v.object({
      shortname: Shortname,
      storageId: v.string(),
    }),
  ),
}, async ({ shortname, storageId }, core) => {
  const { repo, bus } = core;

  const existing = await repo.emoji.get({ shortname });
  if (existing) {
    throw new EmojiAlreadyExists(`emoji ${shortname} already exists`);
  }

  const id = await repo.emoji.create({ shortname, fileId: storageId });
  const emoji = await repo.emoji.get({ id });

  bus.broadcast({
    type: "emoji",
    ...emoji,
  });

  return id;
});
