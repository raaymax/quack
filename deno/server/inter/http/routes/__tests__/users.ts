import { hash } from "@ts-rex/bcrypt";
import { Repository } from "../../../../infra/mod.ts";

export const ensureUser = async (
  repo: Repository,
  login: string,
  data: {} = {},
) => {
  const user = await repo.user.get({ login });
  if (!user) {
    await repo.user.create({
      login,
      password: hash("123"),
      ...data,
    });
  } else {
    await repo.user.update({ id: user.id }, data);
  }
};
