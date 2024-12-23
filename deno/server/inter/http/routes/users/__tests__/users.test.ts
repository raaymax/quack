import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { ensureUser, login } from "../../__tests__/mod.ts";
import { User } from "../../../../../types.ts";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";

const { app, repo, core } = createApp();

Deno.test("GET /api/channels - unauthorized", async () => {
  const agent = await Agent.from(app);
  try {
    await agent.request().get("/api/users/system").expect(401);
    await agent.request().get("/api/users").expect(401);
  } finally {
    await agent.close();
  }
});

Deno.test("GET /api/users/:userId - getUser with an id and alias", async () => {
  await ensureUser(repo, "admin", { name: "Admin" });
  await ensureUser(repo, "member", { name: "Member" });
  await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent)
      .login("admin")
      .getUsers(async (users: User[], { state }) => {
        state.member = users.find((u: User) => u.name === "Member");
        assert(state.member !== undefined);
      })
      .getUser(({ state }) => state.member.id, async (user: User) => {
        assert(user.name === "Member");
        assert(user.password === undefined);
      })
      .end();
  });
});

Deno.test("GET /api/users - getAllUsers", async () => {
  await ensureUser(repo, "admin", { name: "Admin" });
  await ensureUser(repo, "member", { name: "Member" });
  await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent)
      .login("admin")
      .getUsers(async (users: User[]) => {
        const userNames = users.map((u: User) => u.name);
        assert(userNames.includes("Admin"));
        assert(userNames.includes("Member"));
        assert(users[0].password === undefined);
        assert(users[1].password === undefined);
      })
      .end();
  });
});

Deno.test("POST /api/users - user creation flow", async () => {
  let url: string;
  await repo.user.removeMany({ login: "jack" });
  await ensureUser(repo, "admin", { name: "Admin" });
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const admin = Chat.init(repo, agent);
    try {
      await admin.login("admin")
        .createChannel({ name: "user-invite-test" })
        .sendMessage({ flat: "secret" })
        .executeCommand("/invite", [], ({ json }: any) => {
          url = json.data;
        });
      const m = url.match(/https?:\/\/.*\/invite\/(.*)$/);
      assert(m);
      const token = m[1];
      await Chat.init(repo, agent)
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
        })
        .end();
    } finally {
      await admin.end();
    }
  });
});
