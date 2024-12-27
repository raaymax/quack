import { Agent } from "@planigale/testing";
import { ensureUser } from "./users.ts";
import { Repository } from "../../../../infra/mod.ts";
import * as enc from "@quack/encryption";

export async function login(repo: Repository, agent: Agent, email = "admin") {
  // console.log(await repo.user.removeMany({}));
  await ensureUser(repo, email);
  const credentials = await enc.prepareCredentials(email, "123");
  const res = await agent.request()
    .post("/api/auth/session")
    .json(credentials.login)
    .expect(200);
  const body = await res.json();
  return body;
}
