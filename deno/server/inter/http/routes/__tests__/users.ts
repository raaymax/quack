import { Repository } from "../../../../infra/mod.ts";
import { hash } from "@felix/argon2";
import * as enc from "@quack/encryption";

export const ensureUser = async (
  repo: Repository,
  email: string,
  rest: any = {},
) => {
  const user = await repo.user.get({ email });
  if (!user) {
    const data = await enc.prepareRegistration({ email, password: "123" });
    await repo.user.create({
      avatarUrl: "/avatar.png",
      name: data.email,
      email: data.email,
      publicKey: data.publicKey,
      secrets: {
        password: {
          hash: await hash(data.password),
          data: data.secrets,
          createdAt: new Date(),
        },
      },
      ...rest,
    });
  } else {
    await repo.user.update({ id: user.id }, rest);
  }
};
