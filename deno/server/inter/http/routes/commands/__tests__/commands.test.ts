import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";
import { ensureUser } from "../../__tests__/users.ts";

const { app, repo } = createApp();

Deno.test("POST /api/commands/execute - unauthorized", async () => {
  const agent = await Agent.from(app);
  try {
    await agent.request().post("/api/commands/execute").json({}).expect(401);
  } finally {
    await agent.close();
  }
});

Deno.test("command /echo <text>", async () =>
  await Chat.test(
    app,
    { type: "handler" },
    async (agent) =>
      await Chat.init(repo, agent)
        .login("admin")
        .createChannel({ name: "test-commands" })
        .connectSSE()
        .executeCommand("/echo Hello World!!")
        .nextEvent((event, chat) => {
          assertEquals(event.type, "message");
          assert(event.clientId, "Event should have clientId");
          assertEquals(event.flat, "Hello World!!");
          assertEquals(
            (event.message as Record<string, unknown>).text,
            "Hello World!!",
          );
          assertEquals(event.channelId, chat.channelId);
        })
        .end(),
  ));

Deno.test("command /invite", async () => {
  await repo.invitation.removeMany({});
  return await Chat.test(app, { type: "handler" }, async (agent) => {
    let url: string | null = null;
    await Chat.init(repo, agent)
      .login("admin")
      .createChannel({ name: "test-commands-invite" })
      .connectSSE()
      .executeCommand("/invite", ({ json }) => {
        url = json.data as string;
      })
      .nextEvent((event) => {
        assertEquals(event.type, "message");
        assert(event.clientId, "Event should have clientId");
        const m = (event.flat as string).match(
          "(https?://.*/invite/[0-9a-f]{32})",
        );
        assert(m, "Result should contain invitation link");
        assertEquals(m[1], url);
      })
      .end();
  });
});

Deno.test("command /version", async () => {
  await ensureUser(repo, "system", { name: "System" });

  Deno.env.set("APP_VERSION", "server-version");
  return await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent)
      .login("admin")
      .createChannel({ name: "test-commands-version" })
      .connectSSE()
      .executeCommand("/version")
      .nextEvent((event) => {
        assertEquals(event.type, "message");
        assert(event.clientId, "Event should have clientId");
        assertEquals((event.flat as string).includes("server-version"), true);
        assertEquals((event.flat as string).includes("client-version"), true);
      })
      .end();
  });
});

Deno.test("command /help", async () => {
  return await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent)
      .login("admin")
      .createChannel({ name: "test-commands-help" })
      .connectSSE()
      .executeCommand("/help")
      .nextEvent((event) => {
        assertEquals(event.type, "message");
        assert(event.clientId, "Event should have clientId");
        assertEquals((event.flat as string).includes("/invite"), true);
        assertEquals((event.flat as string).includes("/version"), true);
      })
      .end();
  });
});

Deno.test("command /leave", async () => {
  return await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent)
      .login("admin")
      .createChannel({ name: "test-commands-leave" })
      .getChannels((channels) => {
        const channel = channels.find((c) => c.name === "test-commands-leave");
        assert(channel, "User should be in the channel");
      })
      .connectSSE()
      .executeCommand("/leave")
      .nextEvent((event, chat) => {
        assertEquals(event.type, "channel");
        assert(
          !(event.users as string[]).find((u) => u === chat.userId),
          "Updated channel should not contain user",
        );
      })
      .nextEvent((event, chat) => {
        assertEquals(event.type, "removeChannel");
        assertEquals(event.channelId, chat.channelId);
      })
      .nextEvent((event) => {
        assertEquals(event.type, "message");
        assert(event.clientId, "Event should have clientId");
        assertEquals(event.flat, "You have left the channel");
      })
      .getChannels((channels) => {
        const channel = channels.find((c) => c.name === "test-commands-leave");
        assert(!channel, "User should leave the channel");
      })
      .end();
  });
});

Deno.test("command /join", async () => {
  return await Chat.test(app, { type: "handler" }, async (agent) => {
    const member = Chat.init(repo, agent);
    await member
      .login("admin")
      .createChannel({ name: "test-commands-join" });
    await Chat.init(repo, agent)
      .login("admin")
      .step((chat) => {
        chat.channelId = member.channelId;
      })
      .connectSSE()
      .executeCommand("/join")
      .nextEvent((event, chat) => {
        assertEquals(event.type, "channel");
        assertEquals(event.id, chat.channelId);
      })
      .nextEvent((event) => {
        assertEquals(event.type, "message");
        assert(event.clientId, "Event should have clientId");
        assertEquals(event.flat, "You have joined the channel");
      })
      .end();
    await member.end();
  });
});

Deno.test("command /main", async () => {
  return await Chat.test(app, { type: "handler" }, async (agent) => {
    const admin = Chat.init(repo, agent);
    await admin
      .login("admin")
      .createChannel({ name: "test-commands-main" });
    await admin
      .executeCommand("/main")
      .getConfig(async (config) => {
        assertEquals(config.mainChannelId, admin.channelId);
      })
      .end();
  });
});
