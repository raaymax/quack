import * as v from "valibot";
import { createQuery } from "../query.ts";
import { Id } from "../types.ts";
import { ResourceNotFound } from "../errors.ts";

export default createQuery({
  type: "user:config",
  body: v.object({
    id: Id,
  }),
}, async (query, { repo }) => {
  const user = await repo.user.get(query);
  if (!user) {
    throw new ResourceNotFound("User not found");
  }
  const channel = await repo.channel.get({ cid: user.id.toString() });
  return {
    appVersion: Deno.env.get("APP_VERSION"),
    mainChannelId: user?.mainChannelId ?? channel?.id,
  };
});
