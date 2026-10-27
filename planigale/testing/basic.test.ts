import { Planigale, Req } from "@planigale/planigale";
import { SSESink } from "@planigale/sse";
import { assert, assertEquals } from "./deps.ts";
import { TestingQuick, TestingSrv } from "./basic.ts";

[
  TestingSrv,
  TestingQuick,
].forEach((Testing) => {
  Deno.test(`[${Testing.name}] SSESource`, async () => {
    const app = new Planigale();
    const { getUrl, close, listen, createEventSource } = new Testing(app);
    try {
      // Setup
      app.route({
        method: "GET",
        url: "/sse",
        schema: {},
        handler: () => {
          return Response.json({ ok: false }, { status: 400 });
        },
      });
      await listen();

      const source = createEventSource(`${getUrl()}/sse`);
      try {
        await source.next();
      } catch {
        return;
      } finally {
        await source.close();
      }
      throw new Error("Should have thrown");
    } finally {
      // Teardown

      close();
    }
  });

  Deno.test(`[${Testing.name}] Server sent events stream`, async () => {
    const app = new Planigale();
    const { getUrl, close, listen, createEventSource } = new Testing(app);
    try {
      // Setup
      app.route({
        method: "GET",
        url: "/sse",
        schema: {},
        handler: () => {
          const target = new SSESink();
          setTimeout(() => {
            target.sendMessage({ data: "Test" });
            target.close();
          }, 1);
          return target;
        },
      });
      await listen();

      // Test
      const source = createEventSource(`${getUrl()}/sse`);
      const { done, event } = await source.next();
      assert(!done);
      assert(event);
      assertEquals(event.data, "Test");
      //const { done } = await source.next();
      //assertEquals(done, true);
    } finally {
      await close();
    }
  });

  Deno.test(`[${Testing.name}] SSESource happy path`, async () => {
    const app = new Planigale();
    const { getUrl, close, listen, createEventSource } = new Testing(app);
    try {
      // Setup
      app.route({
        method: "GET",
        url: "/sse",
        handler: () => {
          const target = new SSESink();
          setTimeout(() => target.sendMessage({ event: "hello" }), 1);
          setTimeout(() => target.sendMessage({ event: "hello2" }), 2);
          setTimeout(() => target.close(), 3);
          return target;
        },
      });
      await listen();

      // Test
      const source = createEventSource(`${getUrl()}/sse`);
      const { event: ev1 } = await source.next();
      assert(ev1);
      assertEquals(ev1.event, "hello");
      const { event: ev2 } = await source.next();
      assert(ev2);
      assertEquals(ev2.event, "hello2");
      const { done } = await source.next();
      assertEquals(done, true);
    } finally {
      // Teardown
      close();
    }
  });
  Deno.test(`[${Testing.name}] SSESource should send custom headers`, async () => {
    const app = new Planigale();
    const { getUrl, close, listen, createEventSource } = new Testing(app);
    try {
      // Setup
      app.route({
        method: "GET",
        url: "/sse",
        handler: (req: Req) => {
          assertEquals(req.headers["x-test"], "valid");
          const target = new SSESink();
          setTimeout(() => target.close(), 3);
          return target;
        },
      });
      await listen();

      // Test
      const source = createEventSource(`${getUrl()}/sse`, {
        headers: {
          "X-test": "valid",
        },
      });
      const { done } = await source.next();
      assertEquals(done, true);
    } finally {
      // Teardown
      close();
    }
  });
});
