import { Planigale, Req, Res } from "@planigale/planigale";
import { Agent } from "@planigale/testing";
import { assertEquals } from "@std/assert";
import { bodyParser } from "./parser.ts";

const createApp = () => {
  const app = new Planigale();
  app.use(bodyParser);
  app.route({
    method: "POST",
    url: "/with-schema",
    schema: { body: { type: "object" } },
    handler: (req: Req) => Res.json({ body: req.body }),
  });
  app.route({
    method: "POST",
    url: "/without-schema",
    handler: async (req: Req) =>
      Res.json({
        stream: req.body instanceof ReadableStream,
        text: await new Response(req.body).text(),
      }),
  });
  return app;
};

Deno.test("[BODY PARSER] parses json for routes with a body schema", async () => {
  const agent = await Agent.from(createApp());
  try {
    const res = await agent.request()
      .post("/with-schema")
      .json({ a: 1 })
      .expect(200);
    assertEquals(await res.json(), { body: { a: 1 } });
  } finally {
    await agent.close();
  }
});

Deno.test("[BODY PARSER] keeps the raw stream for routes without a body schema", async () => {
  const agent = await Agent.from(createApp());
  try {
    const res = await agent.request()
      .post("/without-schema")
      .json({ a: 1 })
      .expect(200);
    assertEquals(await res.json(), { stream: true, text: '{"a":1}' });
  } finally {
    await agent.close();
  }
});

Deno.test("[BODY PARSER] does not fail on invalid json for routes without a body schema", async () => {
  const agent = await Agent.from(createApp());
  try {
    const res = await agent.request()
      .post("/without-schema")
      .text("{not json")
      .header("Content-Type", "application/json")
      .expect(200);
    assertEquals((await res.json()).text, "{not json");
  } finally {
    await agent.close();
  }
});
