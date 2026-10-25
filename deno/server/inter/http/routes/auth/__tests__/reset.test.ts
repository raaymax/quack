import { assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import * as bcrypt from "@ts-rex/bcrypt";
import { createApp } from "../../__tests__/app.ts";
import * as enc from "@quack/encryption";

Deno.env.set("ENV_TYPE", "test");

const { app, repo, core } = createApp();

Deno.test("PUT /auth/reset/:token - needs the issued token", async () => {
  const email = `legacy-${crypto.randomUUID().slice(0, 8)}`;
  await repo.user.create({ email, password: bcrypt.hash("old") });

  const login = async (password: string) => {
    const res = await Agent.request(app).post("/api/auth/session")
      .json({ email, password })
      .expect(403);
    return (await res.json()).token;
  };
  const token = await login("anything");
  assertEquals(await login("again"), token);

  const data = await enc.prepareRegistration({ email, password: "new" });
  const reset = (path: string, body: Record<string, unknown>, status: number) =>
    Agent.request(app).put(`/api/auth/reset/${path}`).json(body).expect(
      status,
    );

  await reset(token, data, 400);
  await reset("forged", { ...data, oldPassword: "old" }, 403);
  await reset(token, { ...data, oldPassword: "wrong" }, 403);
  await reset(token, { ...data, oldPassword: "old" }, 200);

  await core.close();
});
