import { Planigale, Req, Res } from "@planigale/planigale";
import { Agent } from "./agent.ts";
import { SSESink } from "@planigale/sse";
import { assertEquals } from "./deps.ts";

const app = new Planigale();

const __dirname = new URL(".", import.meta.url).pathname;

// set pwd to __dirname
Deno.chdir(__dirname);

app.route({
  method: "GET",
  url: "/ping",
  schema: {},
  handler: (req: Req) => {
    const data: { ok: boolean; bar?: "foo" } = { ok: true };
    if (req.cookies.get("foo") === "bar") {
      data.bar = "foo";
    }
    return Response.json(data);
  },
});

app.route({
  method: "POST",
  url: "/foo",
  schema: {},
  handler: () => {
    const res = new Res();
    res.status = 200;
    res.cookies.set("foo", "bar");
    res.send({ bar: true });
    return res;
  },
});

app.route({
  method: "GET",
  url: "/stream",
  schema: {},
  handler: () => {
    const res = new Res();
    res.status = 200;
    res.cookies.set("foo", "bar");
    res.body = new ReadableStream({
      start(controller) {
        setTimeout(() => {
          controller.enqueue("Hello\r\n\r\n");
        }, 1000);
      },
    });
    return res;
  },
});

app.route({
  method: "GET",
  url: "/sse",
  schema: {},
  handler: () => {
    const sink = new SSESink();
    const interval = setInterval(() => sink.sendMessage({ data: "Test" }), 1);
    sink.addEventListener("close", () => clearInterval(interval));
    return sink;
  },
});

Deno.test(`[AGENT] testing sse connection`, async () => {
  await Agent.server(app, async (agent: Agent) => {
    const source = agent.connectSSE("/sse");
    const msg = await source.next();
    assertEquals(msg.event?.data, "Test");
  });
});

Deno.test(`[AGENT] testing sse connection cleanup`, async () => {
  let closed = false;
  await Agent.server(app, async (agent: Agent) => {
    const source = agent.connectSSE("/sse");
    await source.next();
    const close = source.close;
    source.close = async () => {
      closed = true;
      await close.call(source);
    };
  });
  assertEquals(closed, true);
});

Deno.test(`[AGENT] testing request building `, async () => {
  await Agent.server(app, async (agent: Agent) => {
    await agent.request()
      .get("/ping")
      .expect(200, { ok: true });
  });
});

Deno.test(`[AGENT] ability to cancel body stream`, async () => {
  await Agent.server(app, async (agent: Agent) => {
    await agent.request()
      .get("/ping")
      .expect(200)
      .discardBody();
  });
});

Deno.test(`[AGENT] ability to allow multiple statuses`, async () => {
  await Agent.server(app, async (agent: Agent) => {
    await agent.request()
      .get("/ping")
      .expect([204, 200])
      .discardBody();
  });
});
Deno.test(`[AGENT] without checking status code in request`, async () => {
  await Agent.server(app, async (agent: Agent) => {
    const ret = await agent.request()
      .get("/ping")
      .discardBody();

    assertEquals(ret.status, 200);
  });
});

Deno.test(`[AGENT] agent should remember cookies`, async () => {
  await Agent.server(app, async (agent: Agent) => {
    await agent.request()
      .post("/foo")
      .json({ bar: true })
      .expect(200, { bar: true });

    await agent.request()
      .get("/ping")
      .expect(200, { ok: true, bar: "foo" });
  });
});

Deno.test(`[AGENT] agent should send file`, async () => {
  await Agent.server(app, async (agent: Agent) => {
    const res = await agent.request()
      .post("/foo")
      .file("tests/testFile.txt")
      .expect(200);
    const json = await res.json();
    assertEquals(json, { bar: true });
  });
});

const types = ["http", "handler"] as const;
types.forEach((type) => {
  Deno.test(`[AGENT][${type.toUpperCase()}] #test() testing request building `, async () => {
    await Agent.test(app, { type }, async (agent: Agent) => {
      await agent.request()
        .get("/ping")
        .expect(200, { ok: true });
    });
  });

  Deno.test(`[AGENT][${type.toUpperCase()}] #test() should remember cookies`, async () => {
    await Agent.test(app, { type }, async (agent: Agent) => {
      await agent.request()
        .post("/foo")
        .json({ bar: true })
        .expect(200, { bar: true });

      await agent.request()
        .get("/ping")
        .expect(200, { ok: true, bar: "foo" });
    });
  });

  Deno.test(`[AGENT][${type.toUpperCase()}] #test() should send file`, async () => {
    await Agent.test(app, { type }, async (agent: Agent) => {
      const res = await agent.request()
        .post("/foo")
        .file("tests/testFile.txt")
        .expect(200);
      const json = await res.json();
      assertEquals(json, { bar: true });
    });
  });
});

Deno.test(`[AGENT] should handle errors gracefully`, async () => {
  const close = app.close;
  const { promise: closed, resolve } = Promise.withResolvers<void>();
  app.close = async () => {
    resolve();
    close.call(app);
  };
  try {
    await Agent.server(app, async (agent: Agent) => {
      await agent.request()
        .get("/ping")
        .expect(500);
    });
  } catch {
    // do nothing
  } finally {
    await closed;
  }
});
