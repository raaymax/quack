import { Agent } from "@planigale/testing";
import { assert, assertEquals } from "@std/assert";
import { config, createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";

Deno.test("webhook should be sent", async (t) => {
  const { app, repo } = createApp({
    ...config,
    webhooks: [
      {
        url: "http://localhost:8123/webhook",
        events: ["message"],
      },
    ],
  });
  const { promise, resolve } = Promise.withResolvers<Record<string, unknown>>();
  const srv = Deno.serve({
    port: 8123,
    handler: async (req) => {
      const event = await req.json();
      resolve(event);
      return Response.json({ ok: true });
    },
    onListen: () => {},
  });

  await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent).login("admin")
      .createChannel({ name: "test-webhooks" })
      .sendMessage({ flat: "test" })
      .end();
  });

  const event = await promise;

  assertEquals(event.type, "message");
  assertEquals((event.event as Record<string, unknown>).flat, "test");

  await srv.shutdown();
  await app.close();
});

Deno.test("should not break if webhook is not responding", async (t) => {
  const { app, repo } = createApp({
    ...config,
    webhooks: [
      {
        url: "http://localhost:8123/webhook",
        events: ["message"],
      },
    ],
  });

  await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent).login("admin")
      .createChannel({ name: "test-webhooks" })
      .sendMessage({ flat: "test" })
      .end();
  });

  await app.close();
});

Deno.test("webhook should be called once", async (t) => {
  let calls = 0;
  const { app, repo } = createApp({
    ...config,
    webhooks: [
      {
        url: "http://localhost:8123/webhook",
        events: ["message"],
      },
    ],
  });
  const { promise, resolve } = Promise.withResolvers<Record<string, unknown>>();
  const srv = Deno.serve({
    port: 8123,
    handler: async (req) => {
      const event = await req.json();
      calls++;
      resolve(event);
      return Response.json({ ok: true });
    },
    onListen: () => {},
  });

  await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent).login("admin")
      .createChannel({ name: "test-webhooks" })
      .sendMessage({ flat: "test" })
      .end();
  });

  const event = await promise;
  await new Promise((r) => setTimeout(r, 100));

  assertEquals(calls, 1);
  assertEquals(event.type, "message");
  assertEquals((event.event as Record<string, unknown>).flat, "test");

  await srv.shutdown();
  await app.close();
});
