import { assert, assertEquals } from "@std/assert";
import { Chat } from "../../__tests__/chat.ts";
import { createApp } from "../../__tests__/app.ts";

const { app, repo, core } = createApp();

Deno.test("/api/channels/:channelId/read-receipts", async () =>
  await Chat.test(
    app,
    { type: "handler" },
    async (agent) =>
      await Chat.init(repo, agent)
        .login("admin")
        .createChannel({ name: "test-read-receipts1" })
        .sendMessage({
          flat: "Hello",
          message: { text: "Hello" },
          clientId: "test0",
        }, (msg, { state }) => {
          state.messageId = msg.id;
        })
        .getChannelReadReceipts((receipts, self) => {
          const receipt = receipts.find((r) => r.channelId === self.channelId);
          assert(receipt, "Receipt should exist");
          assertEquals(receipt.count, 0);
          assertEquals(receipt.lastMessageId, self.state.messageId);
        })
        .end(),
  ));

Deno.test("/api/channels/:channelId/read-receipts - SSE", async () =>
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const member = Chat.init(repo, agent);
    const admin = Chat.init(repo, agent);
    try {
      await member.login("member");
      await admin.login("admin");
      if (!member.userId) throw new Error("No member userId");

      await admin.createChannel({
        name: "test-read-receipts2",
        users: [member.userId],
      });
      await member.openChannel("test-read-receipts2");
      await admin.sendMessage({
        flat: "Hello",
        message: { text: "Hello" },
        clientId: "test1",
      });

      await admin.connectSSE();
      await member
        .getMessages({}, async (messages, { state, channelId }) => {
          state.messageId = messages[0].id;
        })
        .updateReadReceipts(({ state }) => state.messageId);

      await admin.nextEvent((event) => {
        assertEquals(event.type, "readReceipt");
        assertEquals(event.lastMessageId, member.state.messageId);
        assertEquals(event.userId, member.userId);
      });
    } finally {
      await member.end();
      await admin.end();
    }
  }));

Deno.test("/api/read-receipts", async () => {
  await repo.badge.removeMany({});
  return await Chat.test(app, { type: "handler" }, async (agent) => {
    const member = Chat.init(repo, agent);
    const admin = Chat.init(repo, agent);
    try {
      await member.login("member");
      await admin.login("admin");
      if (!member.userId) throw new Error("No member userId");

      await admin.createChannel({
        name: "test-read-receipts3",
        users: [member.userId],
      });
      await member.openChannel("test-read-receipts3");
      await admin.sendMessage({
        flat: "Hello",
        message: { text: "Hello" },
        clientId: "test2",
      });
      await member
        .getMessages({}, async (messages, { state }) => {
          state.messageId = messages[0].id;
        })
        .updateReadReceipts(({ state }) => state.messageId);
      await admin.sendMessage({
        flat: "Hello",
        message: { text: "Hello" },
        clientId: "test3",
      });
      await admin.sendMessage({
        flat: "Hello",
        message: { text: "Hello" },
        clientId: "test4",
      });
      await member.getReadReceipts((receipts) => {
        assertEquals(receipts.length, 1);
        const receipt = receipts.find((r) => r.channelId === member.channelId);
        assert(receipt, "Receipt should exist");
        assertEquals(receipt.count, 2);
      });
    } finally {
      await member.end();
      await admin.end();
    }
  });
});
