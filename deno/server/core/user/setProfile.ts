import * as v from "valibot";
import { createCommand } from "../command.ts";
import { Id } from "../types.ts";

export default createCommand({
  type: "user:setProfile",
  body: v.object({
    id: Id,
    name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
  }),
}, async ({ id, name }, { repo, bus }) => {
  await repo.user.update({ id }, { name });
  const user = await repo.user.getR({ id });

  bus.broadcast({
    type: "user",
    id: user.id,
    name: user.name,
    avatarFileId: user.avatarFileId,
  });

  return user.id;
});
