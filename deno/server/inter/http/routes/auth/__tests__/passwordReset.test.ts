import { assert, assertEquals } from "@std/assert";
import * as bcrypt from "@ts-rex/bcrypt";
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
