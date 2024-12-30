import { assertEquals } from "@std/assert";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";

const { app, repo } = createApp();

Deno.test("Pinning other user messsage", async (t) => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    let pinMessageId = "";
    const admin = Chat.init(repo, agent);
    const member = Chat.init(repo, agent);
    try {
      await admin.login("admin");
      await member.login("member");
      await member.login("other");
      if (!member.userId) throw new Error("member.userId is undefined");
      await admin.createChannel({
        name: "test-messages-pin",
        users: [member.userId],
      });
      await member.openChannel("test-messages-pin");
      await admin.sendMessage({
        flat: "Hello",
        message: { text: "Hello" },
        clientId: "hello",
      }, (msg: any) => {
        pinMessageId = msg.id;
      });
      await t.step("pinning message", async () => {
        await member.pinMessage({ messageId: pinMessageId })
          .getPinnedMessages((messages: any) => {
            assertEquals(messages.length, 1);
            assertEquals(messages[0].id, pinMessageId);
          });
        await admin.getPinnedMessages((messages: any) => {
          assertEquals(messages.length, 1);
          assertEquals(messages[0].id, pinMessageId);
        });
      });
      await t.step("unpinning message by other user", async () => {
        await admin.pinMessage({ messageId: pinMessageId, pinned: false })
          .getPinnedMessages((messages: any) => {
            assertEquals(messages.length, 0);
          });
        await member.getPinnedMessages((messages: any) => {
          assertEquals(messages.length, 0);
        });
      });
    } finally {
      await admin.end();
      await member.end();
    }
  });
});
