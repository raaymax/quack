import { Repository } from "../../../../infra/mod.ts";
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
      ...data,
      ...rest,
    });
  } else {
    await repo.user.update({ id: user.id }, rest);
  }
};
