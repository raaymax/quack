import { Agent } from "@planigale/testing";
import { assertEquals } from "@std/assert";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";
import type { Event, MessageInteractionEvent } from "../../../../../events.ts";
import { EntityId } from "../../../../../types.ts";

const { app, repo, core } = createApp();

Deno.test("POST /api/interactions - dispatching interactions", async (t) => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const admin = Chat.init(repo, agent);
    try {
      await admin
        .login("admin")
        .createChannel({ name: "test-messages-interactions" });
      const { promise, resolve, reject } = Promise.withResolvers<void>();
      (async () => {
        const event: Event = await new Promise((resolve) =>
          core.events.once(resolve)
        );
        if (event.type !== "message:interaction") {
          return reject(new Error("Wrong event type"));
        }
        const interaction = event.payload;
        assertEquals(interaction.userId, EntityId.from(admin.userIdR));
        assertEquals(interaction.channelId, EntityId.from(admin.channelIdR));
        assertEquals(interaction.parentId, undefined);
        assertEquals(interaction.clientId, "clientId");
        assertEquals(interaction.action, "test");
        assertEquals(interaction.payload, { test: "test" });
      })().then(resolve, reject);
      await admin
        .interaction({
          action: "test",
          clientId: "clientId",
          payload: { test: "test" },
        });
    } finally {
      await admin.end();
    }
  });
});

Deno.test("POST /api/interactions - graceful shutdown", async (t) => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const admin = Chat.init(repo, agent);
    try {
      await admin
        .login("admin")
        .createChannel({ name: "test-messages-interactions" });
      for (let i = 0; i < 5; i++) {
        const { promise, resolve } = Promise.withResolvers<Event>();
        core.events.once(resolve);
        await admin.interaction({ action: "test", clientId: "clientId" });
        await promise;
      }
    } finally {
      await admin.end();
    }
  });
});
