import * as v from "valibot";
import * as argon2 from "argon2";
import { createCommand } from "../command.ts";
import * as enc from "@quack/encryption";
import { PasswordResetRequired } from "../errors.ts";

export default createCommand({
  type: "session:create",
  body: v.object({
    email: v.string(),
    password: v.string(),
  }),
}, async ({ email, password }, { repo }) => {
  const user = await repo.user.get({ email });
  if (!user) return null;
  if (user.password) {
    const token = enc.generateRandomToken();
    await repo.user.update({ email }, { resetToken: token });
    throw new PasswordResetRequired(
      "Authentication method is outdated - password reset is required",
      token,
    );
  }

  if (!await argon2.verify(user.secrets.password.hash, password)) return null;
  const sessionId = await repo.session.create({ userId: user.id });
  return sessionId;
});
