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
    email: v.string(),
    password: v.string(),
    publicKey: v.object({}),
    secrets: v.object({
      encrypted: v.string(),
      _iv: v.string(),
    }),
  }),
}, async ({
  token,
  name,
  email,
  password,
  publicKey,
  secrets,
}, { repo }) => {
  const invitation = await repo.invitation.get({ token });
  if (!invitation) {
    throw new InvalidInvitation();
  }

  const existing = await repo.user.get({ email });
  if (existing) throw new UserAlreadyExists();

  const userId = await repo.user.create({
    name,
    email,
    salt: encodeBase64(crypto.getRandomValues(new Uint8Array(16))),
    publicKey,
    secrets: {
      password: {hash: await hash(password), data: secrets, createdAt: new Date()}
    },
    mainChannelId: invitation.channelId,
  });

  await repo.channel.join({ id: invitation.channelId }, userId);
  await repo.invitation.remove({ id: invitation.id });

  return userId;
});
