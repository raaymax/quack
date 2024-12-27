import * as v from "valibot";
import { hash } from "@felix/argon2";
import { createCommand } from "../command.ts";
import { ResourceNotFound } from "../errors.ts";

export default createCommand({
  type: "user:reset",
  body: v.object({
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
  email,
  password,
  publicKey,
  secrets,
}, { repo }) => {
  const existing = await repo.user.get({ email });
  if (!existing) throw new ResourceNotFound("User not found");

  await repo.user.upgrade({ id: existing.id }, {
    publicKey,
    secrets: {
      hash: await hash(password),
      data: secrets,
      createdAt: new Date(),
    },
  });
});
