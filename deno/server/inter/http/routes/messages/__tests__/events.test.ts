import { Agent } from "@planigale/testing";
import { assertEquals } from "@std/assert";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";
import { Message } from '@quack/api'

const { app, repo, core } = createApp();

Deno.test("[EVENTS] When message is sent message:created should be emitted", async (t) => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const { promise, resolve } = Promise.withResolvers<Message>();
    const admin = Chat.init(repo, agent);
    await admin.login("admin")
      .createChannel({
        name: "test-messages-events",
      });
    core.events.once(async (ev) => {
      if (ev.type === "message:created") {
        resolve(ev.payload);
      }
    });
    await admin.sendMessage({
      flat: "Hello",
    });
    const msg = await promise;
    assertEquals(msg.flat, "Hello");
    await admin.end();
  });
});
