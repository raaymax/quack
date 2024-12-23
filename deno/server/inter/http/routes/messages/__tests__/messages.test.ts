import { Agent } from "@planigale/testing";
import { assert, assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import { login, usingChannel } from "../../__tests__/mod.ts";
import { ChannelType, EntityId } from "../../../../../types.ts";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";

Deno.env.set("ENV_TYPE", "test");
const { app, repo, core } = createApp();

const randomChannelId = "66a35e599c8d540997b97808";

Deno.test("/api/channels/:channelId/messages - Authorization failed", async (t) => {
  await t.step(
    "POST /api/channels/:channelId/messages - should be authenticated",
    async () => {
      const res = await Agent.request(app)
        .post(`/api/channels/${randomChannelId}/messages`)
        .json({})
        .expect(401);
      const body = await res.json();
      assertEquals(body.errorCode, "ACCESS_DENIED");
    },
  );

  await t.step(
    "GET /api/channels/:channelId/messages/ - should be authenticated",
    async () => {
      const res = await Agent.request(app)
        .get(`/api/channels/${randomChannelId}/messages/`)
        .expect(401);
      const body = await res.json();
      assertEquals(body.errorCode, "ACCESS_DENIED");
    },
  );

  await t.step(
    "GET /api/messages/:messageId - should be authenticated",
    async () => {
      const res = await Agent.request(app)
        .get("/api/messages/messageId")
        .expect(401);
      const body = await res.json();
      assertEquals(body.errorCode, "ACCESS_DENIED");
    },
  );

  await t.step(
    "PATCH /api/messages/:messageId - should be authenticated",
    async () => {
      const res = await Agent.request(app)
        .patch("/api/messages/messageId")
        .json({})
        .expect(401);
      const body = await res.json();
      assertEquals(body.errorCode, "ACCESS_DENIED");
    },
  );

  await t.step(
    "DELETE /api/messages/:messageId - should be authenticated",
    async () => {
      const res = await Agent.request(app)
        .delete("/api/messages/messageId")
        .emptyBody()
        .expect(401);
      const body = await res.json();
      assertEquals(body.errorCode, "ACCESS_DENIED");
    },
  );
});

Deno.test("/api/channels/:channelId/messages - Auth successful", async (t) => {
  const agent = await Agent.from(app);
  const { token, userId } = await login(repo, agent);
  await usingChannel(repo, {
    name: "test-messages",
    users: [EntityId.from(userId)],
    channelType: ChannelType.PUBLIC,
    private: false,
    direct: false,
    cid: "test-messages",
  }, async (channelId) => {
    let messageId: string;
    await t.step(
      "POST /api/channels/:channelId/messages - createMessage",
      async () => {
        const res = await agent.request()
          .post(`/api/channels/${channelId}/messages`)
          .json({
            message: {
              text: "test",
            },
            clientId: new ObjectId().toHexString(),
            flat: "test",
          })
          .header("Authorization", `Bearer ${token}`)
          .expect(200);
        const body = await res.json();
        assert(typeof body.id === "string");
      },
    );
    await t.step(
      "GET /api/channels/:channelId/messages - getAllMessages",
      async () => {
        const res = await agent.request()
          .get(`/api/channels/${channelId}/messages`)
          .header("Authorization", `Bearer ${token}`)
          .expect(200);
        const body = await res.json();
        assertEquals(body.length, 1);
        assertEquals(body[0].message.text, "test");
        messageId = body[0].id;
        const dbMeessage = await repo.message.get({
          id: EntityId.from(messageId),
        });
        assertEquals(dbMeessage?.id, EntityId.from(messageId));
      },
    );

    await t.step(
      "PATCH /api/messages/:messageId - updateMessage",
      async () => {
        await agent.request()
          .patch(`/api/messages/${messageId}`)
          .json({
            message: {
              text: "updated",
            },
            pinned: true,
          })
          .header("Authorization", `Bearer ${token}`)
          .expect(204);
        const body = await repo.message.get({ id: EntityId.from(messageId) });
        assert(body);
        assert(body.message);
        assert(!Array.isArray(body.message));
        assert("text" in body.message);
        assertEquals(body?.message?.text, "updated");
        assertEquals(body?.pinned, true);
      },
    );

    await t.step(
      "GET /api/messages/:messageId - getMessage",
      async () => {
        const res = await agent.request()
          .get(`/api/messages/${messageId}`)
          .header("Authorization", `Bearer ${token}`)
          .expect(200);
        const body = await res.json();
        assertEquals(body.message.text, "updated");
      },
    );
    await t.step(
      "DELETE /api/messages/:messageId - removeMessage",
      async () => {
        await agent.request()
          .delete(`/api/messages/${messageId}`)
          .emptyBody()
          .header("Authorization", `Bearer ${token}`)
          .expect(204);
        const body = await repo.message.get({ id: EntityId.from(messageId) });
        assertEquals(body, null);
      },
    );
  });
  await agent.close();
});

Deno.test("/api/channels/:channelId/messages - Access constraints", async (t) => {
  const agent = await Agent.from(app);
  const { token, userId } = await login(repo, agent);
  const { token: memberToken, userId: memberUserId } = await login(
    repo,
    agent,
    "member",
  );
  await usingChannel(repo, {
    name: "test-messages-access",
    users: [EntityId.from(userId), EntityId.from(memberUserId)],
    channelType: ChannelType.PUBLIC,
    private: false,
    direct: false,
    cid: "test-messages",
  }, async (channelId) => {
    let messageId: string;
    await t.step(
      "POST /api/channels/:channelId/messages - createMessage admin",
      async () => {
        const res = await agent.request()
          .post(`/api/channels/${channelId}/messages`)
          .json({
            message: {
              text: "test",
            },
            clientId: new ObjectId().toHexString(),
            flat: "test",
          })
          .header("Authorization", `Bearer ${token}`)
          .expect(200);
        const body = await res.json();
        assert(typeof body.id === "string");
      },
    );
    await t.step(
      "GET /api/channels/:channelId/messages - getAllMessages as member",
      async () => {
        const res = await agent.request()
          .get(`/api/channels/${channelId}/messages`)
          .header("Authorization", `Bearer ${memberToken}`)
          .expect(200);
        const body = await res.json();
        assertEquals(body.length, 1);
        assertEquals(body[0].message.text, "test");
        messageId = body[0].id;
        const dbMeessage = await repo.message.get({
          id: EntityId.from(messageId),
        });
        assertEquals(dbMeessage?.id, EntityId.from(messageId));
      },
    );
    await t.step(
      "GET /api/messages/:messageId - getMessage as member",
      async () => {
        const res = await agent.request()
          .get(`/api/messages/${messageId}`)
          .header("Authorization", `Bearer ${memberToken}`)
          .expect(200);
        const body = await res.json();
        assertEquals(body.message.text, "test");
      },
    );
    await t.step(
      "DELETE /api/messages/:messageId - removeMessage as member - no access",
      async () => {
        const res = await agent.request()
          .delete(`/api/messages/${messageId}`)
          .emptyBody()
          .header("Authorization", `Bearer ${memberToken}`)
          .expect(403);
        const body = await res.json();
        assertEquals(body.errorCode, "NOT_OWNER");
      },
    );
  });
  await agent.close();
});

Deno.test("/api/channels/:channelId/messages - Sending to private channel", async (t) => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const { token, userId } = await login(repo, agent);
    const { token: memberToken, userId: memberUserId } = await login(
      repo,
      agent,
      "member",
    );
    await usingChannel(repo, {
      name: "test-messages-access",
      users: [EntityId.from(userId)],
      channelType: ChannelType.PRIVATE,
      private: false,
      direct: false,
      cid: "test-messages",
    }, async (channelId) => {
      await t.step(
        "POST /api/channels/:channelId/messages - createMessage success if not memeber of private channel",
        async () => {
          const res = await agent.request()
            .post(`/api/channels/${channelId}/messages`)
            .json({
              message: {
                text: "test",
              },
              clientId: new ObjectId().toHexString(),
              flat: "test",
            })
            .header("Authorization", `Bearer ${token}`)
            .expect(200);
          const body = await res.json();
          assert(body.id);
        },
      );
      await t.step(
        "POST /api/channels/:channelId/messages - createMessage fail if not memeber of private channel",
        async () => {
          const res = await agent.request()
            .post(`/api/channels/${channelId}/messages`)
            .json({
              message: {
                text: "test",
              },
              clientId: new ObjectId().toHexString(),
              flat: "test",
            })
            .header("Authorization", `Bearer ${memberToken}`)
            .expect(403);
          const body = await res.json();
          assertEquals(body.errorCode, "NO_ACCESS");
        },
      );
      await t.step(
        "POST /api/channels/:channelId/messages - createMessage duplicate information",
        async () => {
          await Chat.init(repo, agent)
            .login("admin")
            .createChannel({ name: "test-messages-duplicate" })
            .sendMessage({
              flat: "Hello",
              message: { text: "Hello" },
              clientId: "duplicate",
            }, (msg, { state }) => {
              state.messageId = msg.id;
            })
            .sendMessage({
              flat: "Hello",
              message: { text: "Hello" },
              clientId: "duplicate",
            }, (msg, { state }) => {
              assertEquals(msg.id, state.messageId);
            })
            .end();
        },
      );
    });
  });
});

Deno.test("Messages server sent events", async () => {
  const agent = await Agent.from(app);
  const { token, userId } = await login(repo, agent);
  const { token: memberToken, userId: memberUserId } = await login(
    repo,
    agent,
    "member",
  );
  await usingChannel(repo, {
    name: "test-messages-access",
    users: [EntityId.from(userId), EntityId.from(memberUserId)],
    channelType: ChannelType.PUBLIC,
    private: false,
    direct: false,
    cid: "test-messages",
  }, async (channelId) => {
    const events = agent.events("/api/sse", {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const { event } = await events.next();
    assertEquals(JSON.parse(event?.data ?? ""), { status: "connected" });

    const res = await agent.request()
      .post(`/api/channels/${channelId}/messages`)
      .json({
        message: {
          text: "test",
        },
        clientId: new ObjectId().toHexString(),
        flat: "test",
      })
      .header("Authorization", `Bearer ${token}`)
      .expect(200);

    const body = await res.json();
    const { event: messageEvent } = await events.next();
    assertEquals(JSON.parse(messageEvent?.data ?? "").id, body.id);
    await events.close();
  });
  await agent.close();
});

Deno.test("Messages history", async (t) => {
  const agent = await Agent.from(app);
  const { token, userId } = await login(repo, agent);
  const { token: memberToken, userId: memberUserId } = await login(
    repo,
    agent,
    "member",
  );
  await usingChannel(repo, {
    name: "test-messages-history",
    users: [EntityId.from(userId), EntityId.from(memberUserId)],
    channelType: ChannelType.PUBLIC,
    private: false,
    direct: false,
    cid: "test-messages",
  }, async (channelId) => {
    const now = Date.now();
    await repo.message.create({
      message: {
        text: "test",
      },
      flat: "t0",
      clientId: "0",
      userId: EntityId.from(userId),
      channelId: EntityId.from(channelId),
      createdAt: new Date(now - 1000),
    });
    await repo.message.create({
      message: {
        text: "test",
      },
      clientId: "1",
      flat: "t1",
      pinned: true,
      userId: EntityId.from(userId),
      channelId: EntityId.from(channelId),
      createdAt: new Date(now - 500),
    });
    await repo.message.create({
      message: {
        text: "test",
      },
      clientId: "2",
      flat: "t2",
      userId: EntityId.from(userId),
      channelId: EntityId.from(channelId),
      createdAt: new Date(now - 300),
    });

    await t.step("GET /api/channels/:channelId/messages - order", async () => {
      const res = await agent.request()
        .get(`/api/channels/${channelId}/messages`)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);

      const body = await res.json();
      assertEquals(body.length, 3);
      assertEquals(body.map((m: any) => m.flat), ["t2", "t1", "t0"]);
    });

    await t.step("GET /api/channels/:channelId/messages - limit", async () => {
      const res = await agent.request()
        .get(`/api/channels/${channelId}/messages?limit=2`)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);

      const body = await res.json();
      assertEquals(body.length, 2);
      assertEquals(body.map((m: any) => m.flat), ["t2", "t1"]);
    });

    await t.step(
      "GET /api/channels/:channelId/messages - before (<=)",
      async () => {
        const res = await agent.request()
          .get(
            `/api/channels/${channelId}/messages?before=${
              new Date(now - 500).toISOString()
            }`,
          )
          .header("Authorization", `Bearer ${token}`)
          .expect(200);

        const body = await res.json();
        assertEquals(body.length, 2);
        assertEquals(body.map((m: any) => m.flat), ["t1", "t0"]);
      },
    );
    await t.step("GET /api/channels/:channelId/messages - before", async () => {
      const res = await agent.request()
        .get(
          `/api/channels/${channelId}/messages?before=${
            new Date(now - 501).toISOString()
          }`,
        )
        .header("Authorization", `Bearer ${token}`)
        .expect(200);

      const body = await res.json();
      assertEquals(body.length, 1);
      assertEquals(body.map((m: any) => m.flat), ["t0"]);
    });
    await t.step("GET /api/channels/:channelId/messages - after", async () => {
      const res = await agent.request()
        .get(
          `/api/channels/${channelId}/messages?after=${
            new Date(now - 500).toISOString()
          }`,
        )
        .header("Authorization", `Bearer ${token}`)
        .expect(200);

      const body = await res.json();
      assertEquals(body.length, 2);
      assertEquals(body.map((m: any) => m.flat), ["t2", "t1"]);
    });
    await t.step("GET /api/channels/:channelId/messages - pinend", async () => {
      const res = await agent.request()
        .get(`/api/channels/${channelId}/messages?pinned=true`)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);

      const body = await res.json();
      assertEquals(body.length, 1);
      assertEquals(body.map((m: any) => m.flat), ["t1"]);
    });
    await t.step("GET /api/channels/:channelId/messages - offset", async () => {
      const res = await agent.request()
        .get(`/api/channels/${channelId}/messages?offset=2&order=asc`)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);

      const body = await res.json();
      assertEquals(body.length, 1);
      assertEquals(body.map((m: any) => m.flat), ["t2"]);
    });
    await t.step("GET /api/channels/:channelId/messages - search", async () => {
      const res = await agent.request()
        .get(`/api/channels/${channelId}/messages?q=t1`)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);

      const body = await res.json();
      assertEquals(body.length, 1);
      assertEquals(body.map((m: any) => m.flat), ["t1"]);
    });
  });
  await agent.close();
});

Deno.test("auto generate message or flat fields if missing", async (t) => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent)
      .login("admin")
      .createChannel({ name: "test-messages-partials" })
      .sendMessage({ flat: "Hello", clientId: "hello0" }, (msg) => {
        assert("text" in msg.message);
        assertEquals(msg.message?.text, "Hello");
      })
      .sendMessage(
        { message: { text: "Hello" }, clientId: "hello1" },
        (msg) => {
          assertEquals(msg.flat, "Hello");
        },
      )
      .sendMessage({ flat: "test" }, (msg) => {
        assertEquals(msg.flat, "test");
        assert(msg.clientId);
      })
      .end();
  });
});
