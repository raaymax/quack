import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";
import { ChannelType } from "../../../../../types.ts";

const { app, repo } = createApp();

Deno.test("GET /api/mobile/notifications - unauthorized", async () => {
  const request = new Request("http://localhost/api/mobile/notifications");
  const res = await app.handle(request);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.errorCode, "ACCESS_DENIED");
});

Deno.test("/api/mobile/notifications - returns connected status", async () => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent)
      .login()
      .step(async (chat) => {
        const source = agent.events("/api/mobile/notifications", {
          headers: { Authorization: `Bearer ${chat.token}` },
        });
        try {
          const { event } = await source.next();
          assert(event);
          const data = JSON.parse(event.data);
          assertEquals(data.status, "connected");
        } finally {
          await source.close();
        }
      })
      .end();
  });
});

Deno.test("/api/mobile/notifications - receives message notification", async () => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const chat = Chat.init(repo, agent);

    await chat
      .login("admin", "123")
      .createChannel({ name: "test-mobile-notifications", channelType: ChannelType.PUBLIC })
      .step(async (c) => {
        // Connect to mobile notifications SSE
        const source = agent.events("/api/mobile/notifications", {
          headers: { Authorization: `Bearer ${c.token}` },
        });

        try {
          // Wait for connected event
          const { event: connEvent } = await source.next();
          assert(connEvent);
          assertEquals(JSON.parse(connEvent.data).status, "connected");

          // Send a message
          const res = await agent.request()
            .post(`/api/channels/${c.channelId}/messages`)
            .json({ flat: "Hello from mobile test!" })
            .header("Authorization", `Bearer ${c.token}`)
            .expect(200);

          await res.json();

          // Receive the notification
          const { event: msgEvent } = await source.next();
          assert(msgEvent);
          const notification = JSON.parse(msgEvent.data);

          // Verify notification payload structure
          assertEquals(notification.type, "notification");
          assert(notification.channelId, "Should have channelId");
          assert(notification.title, "Should have title");
          assert(notification.body, "Should have body");
          assertEquals(notification.body, "Hello from mobile test!");
        } finally {
          await source.close();
        }
      })
      .end();
  });
});

Deno.test("/api/mobile/notifications - notification includes channel name for public channels", async () => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const chat = Chat.init(repo, agent);

    await chat
      .login("admin", "123")
      .createChannel({ name: "mobile-channel-name-test", channelType: ChannelType.PUBLIC })
      .step(async (c) => {
        const source = agent.events("/api/mobile/notifications", {
          headers: { Authorization: `Bearer ${c.token}` },
        });

        try {
          // Skip connected event
          await source.next();

          // Send message
          await agent.request()
            .post(`/api/channels/${c.channelId}/messages`)
            .json({ flat: "Test message" })
            .header("Authorization", `Bearer ${c.token}`)
            .expect(200);

          // Get notification
          const { event } = await source.next();
          assert(event);
          const notification = JSON.parse(event.data);

          // Title should include channel name for public channels
          assert(
            notification.title.includes("mobile-channel-name-test"),
            `Title should include channel name, got: ${notification.title}`,
          );
        } finally {
          await source.close();
        }
      })
      .end();
  });
});

Deno.test("/api/mobile/notifications - notification includes sender name", async () => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const chat = Chat.init(repo, agent);

    await chat
      .login("admin", "123")
      .createChannel({ name: "mobile-sender-test", channelType: ChannelType.PUBLIC })
      .step(async (c) => {
        const source = agent.events("/api/mobile/notifications", {
          headers: { Authorization: `Bearer ${c.token}` },
        });

        try {
          // Skip connected event
          await source.next();

          // Send message
          await agent.request()
            .post(`/api/channels/${c.channelId}/messages`)
            .json({ flat: "Test from admin" })
            .header("Authorization", `Bearer ${c.token}`)
            .expect(200);

          // Get notification
          const { event } = await source.next();
          assert(event);
          const notification = JSON.parse(event.data);

          // Should include sender info
          assert(notification.senderId, "Should have senderId");
          assert(notification.senderName, "Should have senderName");
        } finally {
          await source.close();
        }
      })
      .end();
  });
});

Deno.test("/api/mobile/notifications - includes thread info for replies", async () => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const chat = Chat.init(repo, agent);
    let parentMessageId: string;

    await chat
      .login("admin", "123")
      .createChannel({ name: "mobile-thread-test", channelType: ChannelType.PUBLIC })
      .sendMessage({ flat: "Parent message" }, (msg) => {
        parentMessageId = msg.id;
      })
      .step(async (c) => {
        const source = agent.events("/api/mobile/notifications", {
          headers: { Authorization: `Bearer ${c.token}` },
        });

        try {
          // Skip connected event
          await source.next();

          // Send reply to thread
          await agent.request()
            .post(`/api/channels/${c.channelId}/messages`)
            .json({ flat: "Reply in thread", parentId: parentMessageId })
            .header("Authorization", `Bearer ${c.token}`)
            .expect(200);

          // When a reply is sent, two events are emitted:
          // 1. Parent message update (thread info added)
          // 2. The actual reply
          // We need to get the reply notification (the one with parentId)
          let notification;
          for (let i = 0; i < 2; i++) {
            const { event } = await source.next();
            assert(event);
            notification = JSON.parse(event.data);
            if (notification.parentId) break;
          }

          // Should include parentId for thread replies
          assertEquals(notification.parentId, parentMessageId);
        } finally {
          await source.close();
        }
      })
      .end();
  });
});
