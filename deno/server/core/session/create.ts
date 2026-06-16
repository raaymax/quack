import * as v from "valibot";
import * as argon2 from "argon2";
import { createCommand } from "../command.ts";
import * as enc from "@quack/encryption";
import { PasswordResetRequired } from "../errors.ts";
import { SESSION_TTL_SECONDS } from "./constants.ts";

export default createCommand({
  type: "session:create",
  body: v.object({
    email: v.string(),
    password: v.string(),
    legacyPassword: v.optional(v.string()),
  }),
}, async ({ email, password, legacyPassword }, { repo }) => {
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

  const storedHash = user.secrets.password.hash;
  if (!await argon2.verify(storedHash, password)) {
    if (
      !legacyPassword || !await argon2.verify(storedHash, legacyPassword)
    ) {
      return null;
    }
    await repo.user.updateCredentials({ email }, "password", {
      ...user.secrets.password,
      hash: await argon2.hash(password),
    });
  }

  const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const sessionId = await repo.session.create({ userId: user.id, expires });
  return sessionId;
});
