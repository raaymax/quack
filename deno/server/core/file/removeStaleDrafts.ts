import * as v from "valibot";
import { createCommand } from "../command.ts";

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export default createCommand({
  type: "file:removeStaleDrafts",
  body: v.object({
    maxAgeMs: v.optional(v.number(), DEFAULT_MAX_AGE_MS),
  }),
}, async ({ maxAgeMs }, core) => {
  const { repo, storage } = core;
  const cutoff = new Date(Date.now() - maxAgeMs);
  const drafts = await repo.file.getStaleDrafts(cutoff);

  for (const file of drafts) {
    const stillReferenced = await repo.file.count({
      storageId: file.storageId,
      status: "attached",
    });
    if (stillReferenced === 0) {
      await storage.remove(file.storageId);
    }
    await repo.file.remove({ id: file.id });
  }
});
