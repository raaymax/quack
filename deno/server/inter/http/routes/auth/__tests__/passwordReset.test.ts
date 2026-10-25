import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import * as bcrypt from "@ts-rex/bcrypt";
import * as enc from "@quack/encryption";
import { Chat, createApp } from "../../__tests__/mod.ts";

const { app, repo } = createApp();

Deno.test("Password Reset - wrong old password", async () => {
  await repo.user.removeMany({ email: "reset-user" });
  await repo.user.create({
    email: "reset-user",
    password: bcrypt.hash("123"),
  });
  await Chat.test(app, { type: "http" }, async (agent) => {
    let token = "";
    const chat = Chat.init(repo, agent);
    await chat
      .login("reset-user", "123", (session) => {
        assert(session.status === "error");
        assertEquals(session.errorCode, "PASSWORD_RESET_REQUIRED");
        token = session?.token;
      });
    await chat.isResetValid(token)
      .reset({
        token: token,
        email: "reset-user",
        oldPassword: "321",
        password: "reset-password",
      }, (result) => {
        assert(result.status === "error");
        assertEquals(result.errorCode, "NO_ACCESS");
      })
      .login("reset-user", "reset-password", (session) => {
        assert(session.status === "error");
      })
      .end();
  });
});
Deno.test("Password Reset - password reset flow", async () => {
  await repo.user.removeMany({ email: "reset-user" });
  await repo.user.create({
    email: "reset-user",
    password: bcrypt.hash("123"),
  });
  const user = await repo.user.get({ email: "reset-user" });
  await Chat.test(app, { type: "http" }, async (agent) => {
    let token = "";
    const chat = Chat.init(repo, agent);
    await chat
      .login("reset-user", "123", (session) => {
        assert(session.status === "error");
        assertEquals(session.errorCode, "PASSWORD_RESET_REQUIRED");
        token = session?.token;
      });
    await chat.isResetValid(token)
      .reset({
        token: token,
        email: "reset-user",
        oldPassword: "123",
        password: "reset-password",
      })
      .login("reset-user", "reset-password", (session) => {
        assert(session.status === "ok");
        assertEquals(session.userId, user?.id.toString());
        assertEquals(typeof session.secrets.encrypted, "string");
      })
      .end();
  });
});
Deno.test("Password Reset - forged token", async () => {
  await repo.user.removeMany({ email: "reset-user" });
  await repo.user.create({
    email: "reset-user",
    password: bcrypt.hash("123"),
  });
  await Chat.test(app, { type: "http" }, async (agent) => {
    await Chat.init(repo, agent)
      .reset({
        token: "forged",
        email: "reset-user",
        oldPassword: "123",
        password: "reset-password",
      }, (result) => {
        assert(result.status === "error");
        assertEquals(result.errorCode, "NO_ACCESS");
      })
      .login("reset-user", "reset-password", (session) => {
        assert(session.status === "error");
        assertEquals(session.errorCode, "PASSWORD_RESET_REQUIRED");
      })
      .end();
  });
});
Deno.test("Password Reset - token is kept between logins", async () => {
  await repo.user.removeMany({ email: "reset-user" });
  await repo.user.create({
    email: "reset-user",
    password: bcrypt.hash("123"),
  });
  await Chat.test(app, { type: "http" }, async (agent) => {
    let token = "";
    await Chat.init(repo, agent)
      .login("reset-user", "123", (session) => {
        assert(session.status === "error");
        token = session.token;
      })
      .login("reset-user", "123", (session) => {
        assert(session.status === "error");
        assertEquals(session.token, token);
      })
      .reset(() => ({
        token,
        email: "reset-user",
        oldPassword: "123",
        password: "reset-password",
      }), (result) => {
        assertEquals(result.status, "ok");
      })
      .login("reset-user", "reset-password", (session) => {
        assertEquals(session.status, "ok");
      })
      .end();
  });
});
Deno.test("PUT /auth/reset/:token - missing oldPassword", async () => {
  const data = await enc.prepareRegistration({
    email: "reset-user",
    password: "reset-password",
  });
  const res = await Agent.request(app)
    .put("/api/auth/reset/some-token")
    .json(data)
    .expect(400);
  const body = await res.json();
  assertEquals(
    body.errors?.map((e: Record<string, unknown>) =>
      (e?.params as Record<string, unknown>)?.missingProperty
    ),
    ["oldPassword"],
  );
});
