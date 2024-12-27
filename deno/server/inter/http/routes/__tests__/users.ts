import { hash } from "@felix/argon2";
import { Repository } from "../../../../infra/mod.ts";
import * as enc from "@quack/encryption";

export const ensureUser = async (
  repo: Repository,
  email: string,
  data: any = {},
) => {
  const user = await repo.user.get({ email });
  if (!user) {
    const password = "123";
    const salt = await enc.deriveSaltFromEmail(email);
    const {publicKey, privateKey} = await enc.generateECKeyPair();
    const {hash: passwordHash, encryptionKey} = await enc.generatePasswordKeys(password, salt);
    const secrets = await enc.encrypt({
      privateKey,
      encryptionKey,
      sanityCheck: "valid",
    }, encryptionKey);

    await repo.user.create({
      email,
      publicKey,
      secrets: {
        password: {hash: await hash(passwordHash), data: secrets, createdAt: new Date()}
      },
      ...data
    });
  } else {
    await repo.user.update({ id: user.id }, data);
  }
};
