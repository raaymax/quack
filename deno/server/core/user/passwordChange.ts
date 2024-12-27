import * as v from "valibot";
import { hash } from "@felix/argon2";
import { createCommand } from "../command.ts";
import { ResourceNotFound } from "../errors.ts";

export default createCommand({
  type: "user:password:change",
  body: v.object({
    email: v.string(),
    password: v.string(),
    publicKey: v.optional(v.object({})),
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

  if(publicKey) {
    await repo.user.update({id: existing.id}, {publicKey}); 
  }

  await repo.user.updatePassword(
    { id: existing.id }, 
    { type: 'argon2', hash: await hash(password), secrets, createdAt: new Date() }
  );
});
