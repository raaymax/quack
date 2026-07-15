import * as v from "valibot";
import { createCommand } from "../command.ts";
import { Id } from "../types.ts";

export default createCommand({
  type: "user:setAvatar",
  body: v.object({
    id: Id,
    storageId: v.string(),
  }),
}, async ({ id, storageId }, { repo, storage, bus }) => {
  const previous = await repo.user.getR({ id });
  const oldAvatarFileId = previous.avatarFileId;

  await repo.user.update({ id }, { avatarFileId: storageId });

  if (oldAvatarFileId && oldAvatarFileId !== storageId) {
    await storage.remove(oldAvatarFileId).catch(() => {});
  }

  const user = await repo.user.getR({ id });
  bus.broadcast({
    type: "user",
    id: user.id,
    name: user.name,
    avatarFileId: user.avatarFileId,
  });

  return user.id;
});
