import * as v from "valibot";
import { hash } from "@felix/argon2";
import { encodeBase64 } from "@std/encoding/base64";
import { createCommand } from "../command.ts";
import { InvalidInvitation, UserAlreadyExists } from "../errors.ts";

export default createCommand({
  type: "user:create",
  body: v.object({
    token: v.string(),
    name: v.string(),
    login: v.string(),
    password: v.string(),
  }),
}, async ({
  token,
  name,
  login,
  password,
}, { repo }) => {
  const invitation = await repo.invitation.get({ token });
  if (!invitation) {
    throw new InvalidInvitation();
  }

  const existing = await repo.user.get({ login });
  if (existing) throw new UserAlreadyExists();

  const userId = await repo.user.create({
    name,
    login,
    salt: encodeBase64(crypto.getRandomValues(new Uint8Array(16))),
    authType: "argon2",
    password: await hash(password),
    mainChannelId: invitation.channelId,
  });

  await repo.channel.join({ id: invitation.channelId }, userId);
  await repo.invitation.remove({ id: invitation.id });

  return userId;
});
