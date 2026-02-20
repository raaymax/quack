import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { login } from "../../__tests__/mod.ts";
import { ObjectId } from "../../../../../infra/mod.ts";
import { Channel, ChannelType, EntityId } from "../../../../../types.ts";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";

const { app, repo, core } = createApp();

Deno.test("/api/channels/* - unauthorized", async () => {
  const { app, repo, core } = createApp();
  const agent = await Agent.from(app);
  try {
    await agent.request().post("/api/channels").emptyBody().expect(401);
    await agent.request().get("/api/channels").expect(401);
    await agent.request().get("/api/channels/xyz").expect(401);
    await agent.request().delete("/api/channels/xyz").emptyBody().expect(401);
  } finally {
    await agent.close();
  }
});

Deno.test("/api/channels", async () => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent)
      .login("admin")
      .connectSSE()
      .createChannel({ name: "test-channel-creation" })
      .nextEvent((event) => {
        assertEquals(event.type, "channel");
        assertEquals(event.name, "test-channel-creation");
      })
      .getChannel(async (channel) => {
        assertEquals(channel.name, "test-channel-creation");
        assertEquals(channel.private, false);
        assertEquals(channel.direct, false);
        assertEquals(channel.users.length, 1);
        assertEquals(channel.channelType, "PUBLIC");
      })
      .getChannels(async (channels) => {
        const channel = channels.find((c) =>
          c.name === "test-channel-creation"
        );
        assert(channel);
        assertEquals(channel.name, "test-channel-creation");
      })
      .removeChannel()
      .end();
  });
});

Deno.test("/api/channels - channel with description", async () => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent)
      .login("admin")
      .connectSSE()
      .createChannel({
        name: "test-channel-with-description",
        description: "This is a test channel description",
      })
      .nextEvent((event) => {
        assertEquals(event.type, "channel");
        assertEquals(event.name, "test-channel-with-description");
        assertEquals(event.description, "This is a test channel description");
      })
      .getChannel(async (channel) => {
        assertEquals(channel.name, "test-channel-with-description");
        assertEquals(channel.description, "This is a test channel description");
      })
      .removeChannel()
      .end();
  });
});

Deno.test("/api/channels - other user receives notification about channel", async () =>
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const member = Chat.init(repo, agent).login("member");
    const admin = Chat.init(repo, agent).login("admin");
    try {
      await member.connectSSE();
      await admin.createChannel({
        name: "test-channel-creation-2",
        users: [member.userIdR],
      });
      await member
        .nextEvent((event) => {
          assertEquals(event.type, "channel");
          assertEquals(event.name, "test-channel-creation-2");
        })
        .end();
    } finally {
      await member.end();
      await admin.end();
    }
  }));
