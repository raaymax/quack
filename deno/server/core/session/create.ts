import * as v from "valibot";
import * as bcrypt from "@ts-rex/bcrypt";
import * as argon2 from "@felix/argon2";
import { createCommand } from "../command.ts";

export default createCommand({
  type: "session:create",
  body: v.object({
    login: v.string(),
    password: v.string(),
  }),
}, async ({ login, password }, { repo }) => {
  const user = await repo.user.get({ login });
  if (!user) return null;

  switch (user.authType) {
    case "argon2": {
      if (!await argon2.verify(user.password, password)) return null;
      break;
    }
    default:
    case "bcrypt": {
      if (!bcrypt.verify(password, user.password)) return null;
      const hash = await argon2.hash(password);
      await repo.user.update({ id: user.id }, {
        password: hash,
        authType: "argon2",
      });
      break;
    }
  }

  const sessionId = await repo.session.create({ userId: user.id });
  return sessionId;
});
