import * as v from "valibot";
import { Id } from "../types.ts";
import { createQuery } from "../query.ts";

export default createQuery({
  type: "session:get",
  body: v.object({
    id: v.optional(Id),
    token: v.optional(v.string()),
  }),
}, async (query, { repo }) => {
  const session = await repo.session.get(query);
  if (!session) return null;
  const user = await repo.user.get({ id: session.userId });
  if (!user) return null;
  return {
    ...session,
    secrets: user.secrets.password.data,
    publicKey: user.publicKey,
  };

})
