import * as v from "valibot";
import { createQuery } from "../query.ts";

export default createQuery({
  type: "user:reset:verify",
  body: v.object({
    token: v.string(),
  }),
}, async (query, { repo }) => {
  const user = await repo.user.get({ resetToken: query.token });
  if (!user) {
    return null;
  }
  return user;
});
