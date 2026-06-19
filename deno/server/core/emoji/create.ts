import * as v from "valibot";
import { createCommand } from "../command.ts";
import { EmojiAlreadyExists } from "../errors.ts";

const Shortname = v.pipe(
  v.string(),
  v.transform((i) =>
    `:${(i as string).trim().replace(/^:/, "").replace(/:$/, "")}:`
  ),
  v.regex(
    /^:[a-zA-Z0-9_+-]+:$/,
    "invalid emoji shortname, expected :shortname:",
  ),
);

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
