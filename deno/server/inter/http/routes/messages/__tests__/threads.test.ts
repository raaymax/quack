import { Agent } from "@planigale/testing";
import { assertEquals } from "@std/assert";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";

const { app, repo } = createApp();

Deno.test("sending messages to threads", async (t) => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent)
      .login("admin")
      .createChannel({ name: "test-messages-threads" })
      .sendMessage({
        flat: "Hello",
      })
      .sendMessage({
        flat: "Hello",
      }, (msg, { state }) => {
        state.parentId = msg.id;
      })
      .sendMessage({
        flat: "Hello",
      })
      .sendMessage(({ state }) => ({ flat: "msg1", parentId: state.parentId }))
      .sendMessage(({ state }) => ({ flat: "msg2", parentId: state.parentId }))
      .getMessages({ parentId: null }, (messages) => {
        assertEquals(messages.length, 3);
        assertEquals((messages[1].thread as unknown[]).length, 2);
      })
      .getMessages(
        ({ state }) => ({ parentId: state.parentId }),
        (messages, { state }) => {
          assertEquals(messages.length, 3);
          assertEquals((messages[0].thread as unknown[]).length, 2);
          assertEquals(messages[0].id, state.parentId);
        },
      )
      .end();
  });
});
