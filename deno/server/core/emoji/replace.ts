import * as v from "valibot";
import { createCommand } from "../command.ts";
import { ResourceNotFound } from "../errors.ts";
import { Shortname } from "./shortname.ts";

export default createCommand({
  type: "emoji:replace",
  body: v.required(
    v.object({
      shortname: Shortname,
      storageId: v.string(),
    }),
  ),
}, async ({ shortname, storageId }, core) => {
  const { repo, bus, storage } = core;

  const existing = await repo.emoji.get({ shortname });
  if (!existing) {
    throw new ResourceNotFound(`emoji ${shortname} not found`);
  }

  const oldStorageId = existing.fileId;
  await repo.emoji.update({ id: existing.id }, { fileId: storageId });

  if (oldStorageId && oldStorageId !== storageId) {
    const stillReferenced = await repo.emoji.count({ fileId: oldStorageId });
    if (stillReferenced === 0) {
      await storage.remove(oldStorageId);
    }
  }

  const emoji = await repo.emoji.get({ id: existing.id });
  bus.broadcast({
    type: "emoji",
    ...emoji,
  });

  return existing.id;
});
