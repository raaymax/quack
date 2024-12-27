import { assert, assertEquals } from "@std/assert";
import { ensureUser } from "../../__tests__/mod.ts";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";
import * as enc from "@quack/encryption";

const { app, repo, core } = createApp();

Deno.test("POST /api/users - user creation flow", async (t) => {
  let url: string;
  let token: string;
  let token2: string;
  await repo.invitation.removeMany({});
  await repo.user.removeMany({ email: "jack" });
  await ensureUser(repo, "admin", { name: "Admin" });
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const admin = Chat.init(repo, agent);
    try {
      await admin.login("admin")
        .createChannel({ name: "user-invite-test" })
        .sendMessage({ flat: "secret" });

      await t.step("creating invite", async () => {
        await admin.executeCommand("/invite", [], ({ json }: any) => {
          url = json.data;
        });
        const m = url.match(/https?:\/\/.*\/invite\/(.*)$/);
        assert(m);
        token = m?.[1] ?? "";
      });

      await t.step("creating second invite", async () => {
        let url2: string = "";
        await admin.executeCommand("/invite", [], ({ json }: any) => {
          url2 = json.data;
        });
        const m = url2.match(/https?:\/\/.*\/invite\/(.*)$/);
        assert(m);
        token2 = m?.[1] ?? "";
      });
      await t.step("check valid token", async () => {
        await Chat.init(repo, agent)
          .checkToken(token, ({ valid }) => assert(valid))
          .end();
      });
      await t.step("check valid token second", async () => {
        await Chat.init(repo, agent)
          .checkToken(token2, ({ valid }) => assert(valid))
          .end();
      });
      const chat = Chat.init(repo, agent);

      await t.step("register user", async () => {
        await chat
          .checkToken(token, ({ valid }) => assert(valid))
          .register({
            token,
            name: "Jack",
            email: "jack",
            password: "test123",
          })
          .login("jack", "test123")
          .openChannel("user-invite-test")
          .getMessages({}, (msgs: any[]) => {
            assertEquals(msgs[0].flat, "secret");
          });
      });

      await t.step("user already exists", async () => {
        const data = await enc.prepareRegistration({
          name: "Jack",
          email: "jack",
          password: "test123",
        });
        await agent.request()
          .post(`/api/users/${token2}`)
          .json(data)
          .expect(409, {
            errorCode: "USER_ALREADY_EXISTS",
            message: "User already exists",
          });
      });

      await chat.end();

      await t.step("check invalid token", async () => {
        const data = await enc.prepareRegistration({
          name: "Jack",
          email: "jack",
          password: "test123",
        });

        await Chat.init(repo, agent)
          .checkToken(token, ({ valid }) => assert(!valid))
          .end();

        await agent.request()
          .post(`/api/users/${token}`)
          .json(data)
          .expect(400, {
            errorCode: "INVALID_INVITATION",
            message: "Invalid invitation link",
          });
      });
    } finally {
      await admin.end();
    }
  });
});
