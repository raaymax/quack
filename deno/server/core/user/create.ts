import * as v from "valibot";
import { hash } from "argon2";
import { createCommand } from "../command.ts";
import { InvalidInvitation, UserAlreadyExists } from "../errors.ts";

export default createCommand({
  type: "user:create",
  body: v.object({
    token: v.string(),
    name: v.string(),
    email: v.string(),
    password: v.string(),
    publicKey: v.object({
      crv: v.string(),
      ext: v.boolean(),
      key_ops: v.array(v.string()),
      kty: v.string(),
      x: v.string(),
      y: v.string(),
    }),
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
    publicKey,
    secrets: {
      password: {
        hash: await hash(password),
        data: secrets,
        createdAt: new Date(),
      },
    },
    mainChannelId: invitation.channelId,
  });

  const channel = await repo.channel.get({ id: invitation.channelId });
  if (channel && channel.channelType !== "DIRECT") {
    await repo.channel.join({ id: invitation.channelId }, userId);
  }
  await repo.invitation.remove({ id: invitation.id });

  return userId;
});
