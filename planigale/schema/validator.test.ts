import { Planigale, Req, Res } from "@planigale/planigale";
import { assertEquals } from "./deps_test.ts";
import { Agent, TestingQuick, TestingSrv } from "@planigale/testing";
import { SchemaValidator } from "./validator.ts";
import { bodyParser } from "@planigale/body-parser";

[
  TestingSrv,
  TestingQuick,
].forEach((Testing) => {
  Deno.test(`[VALIDATION] [${Testing.name}] Async body validation`, async () => {
    const app = new Planigale();
    const validator = new SchemaValidator();
    app.use(bodyParser);
    app.use(validator.middleware);
    app.route({
      method: "POST",
      url: "/body",
      schema: {
        body: {
          $async: true,
          type: "object",
          required: ["data"],
          properties: {
            data: { type: "string" },
          },
        },
      },
      handler: async (req: Req) => {
        assertEquals(req.body.data, "oko");
        return Response.json({ ok: true });
      },
    });

    await Agent.server(app, async (agent) => {
      await agent.request()
        .post("/body")
        .json({ data: "oko" })
        .expect(200, { ok: true });
    });
  });
  Deno.test(`[VALIDATION] [${Testing.name}] Body validation`, async () => {
    const app = new Planigale();
    const validator = new SchemaValidator();
    app.use(bodyParser);
    app.use(validator.middleware);
    app.route({
      method: "POST",
      url: "/body",
      schema: {
        body: {
          type: "object",
          required: ["data"],
          properties: {
            data: { type: "string" },
          },
        },
      },
      handler: async (req: Req) => {
        assertEquals(req.body.data, "oko");
        return Response.json({ ok: true });
      },
    });

    await Agent.server(app, async (agent) => {
      await agent.request()
        .post("/body")
        .json({ data: "oko" })
        .expect(200, { ok: true });
    });
  });

  Deno.test(`[VALIDATION] [${Testing.name}] Query validation`, async () => {
    const app = new Planigale();
    const validator = new SchemaValidator();
    app.use(validator.middleware);
    app.route({
      method: "POST",
      url: "/query",
      schema: {
        query: {
          type: "object",
          required: ["data"],
          properties: {
            data: { type: "number" },
          },
        },
      },
      handler: async (req: Req) => {
        assertEquals(typeof req.query.data, "number");
        assertEquals(req.query.data, 123);
        return Response.json({ ok: true });
      },
    });

    await Agent.server(app, async (agent) => {
      await agent.request()
        .post("/query?data=123")
        .json({ data: "oko" })
        .expect(200, { ok: true });
    });
  });

  Deno.test(`[VALIDATION] [${Testing.name}] Async body validation failed`, async () => {
    const app = new Planigale();
    const validator = new SchemaValidator();
    app.use(bodyParser);
    app.use(validator.middleware);
    app.route({
      method: "POST",
      url: "/body",
      schema: {
        body: {
          $async: true,
          type: "object",
          required: ["data"],
          properties: {
            data: { type: "string" },
          },
        },
      },
      handler: async (_req: Req) => {
        throw new Error("Should not be called");
      },
    });

    await Agent.server(app, async (agent) => {
      await agent.request()
        .post("/body")
        .json({ other: "oko" })
        .expect(400, {
          errorCode: "VALIDATION_ERROR",
          message: "Validation failed",
          errors: [
            {
              block: "body",
              instancePath: "",
              keyword: "required",
              message: "must have required property 'data'",
              params: {
                missingProperty: "data",
              },
              schemaPath: "#/required",
            },
          ],
        });
    });
  });

  Deno.test(`[VALIDATION] [${Testing.name}] Body validation failed`, async () => {
    const app = new Planigale();
    const validator = new SchemaValidator();
    app.use(bodyParser);
    app.use(validator.middleware);
    app.route({
      method: "POST",
      url: "/body",
      schema: {
        body: {
          type: "object",
          required: ["data"],
          properties: {
            data: { type: "string" },
          },
        },
      },
      handler: async (_req: Req) => {
        throw new Error("Should not be called");
      },
    });

    await Agent.server(app, async (agent) => {
      await agent.request()
        .post("/body")
        .json({ other: "oko" })
        .expect(400, {
          errorCode: "VALIDATION_ERROR",
          message: "Validation failed",
          errors: [
            {
              block: "body",
              instancePath: "",
              keyword: "required",
              message: "must have required property 'data'",
              params: {
                missingProperty: "data",
              },
              schemaPath: "#/required",
            },
          ],
        });
    });
  });

  Deno.test(`[VALIDATION] [${Testing.name}] Schema reference / external schemas`, async () => {
    const app = new Planigale();
    const validator = new SchemaValidator();
    validator.addSchema({
      $id: "user",
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
      },
    });
    app.use(bodyParser);
    app.use(validator.middleware);
    app.route({
      method: "POST",
      url: "/body",
      schema: {
        body: {
          type: "object",
          required: ["data"],
          properties: {
            data: { $ref: "user#" },
          },
        },
      },
      handler: async (_req: Req) => {
        throw new Error("Should not be called");
      },
    });

    await Agent.server(app, async (agent) => {
      await agent.request()
        .post("/body")
        .json({ data: { id: 123 } })
        .expect(400, {
          errorCode: "VALIDATION_ERROR",
          message: "Validation failed",
          errors: [
            {
              block: "body",
              instancePath: "/data",
              keyword: "required",
              message: "must have required property 'name'",
              params: {
                missingProperty: "name",
              },
              schemaPath: "user#/required",
            },
          ],
        });
    });
  });

  Deno.test(`[VALIDATION] [${Testing.name}] Schema formats`, async () => {
    const app = new Planigale();
    const validator = new SchemaValidator();
    validator.addFormat("f1", /test/);
    validator.addFormat("f2", (v) => v === "test2");
    validator.addFormat("f3", {
      type: "string",
      validate: (v) => v === "test3",
    });
    app.use(bodyParser);
    app.use(validator.middleware);
    app.route({
      method: "POST",
      url: "/body",
      schema: {
        body: {
          type: "object",
          required: ["data"],
          properties: {
            data: { type: "string", format: "f1" },
            data2: { type: "string", format: "f2" },
            data3: { type: "string", format: "f3" },
          },
        },
      },
      handler: async (_req: Req) => {
        return Res.empty();
      },
    });

    await Agent.server(app, async (agent) => {
      await agent.request()
        .post("/body")
        .json({
          data: "any test any",
          data2: "test2",
          data3: "test3",
        })
        .expect(204);

      await agent.request()
        .post("/body")
        .json({
          data: "invalid",
          data2: "invalid",
          data3: "invalid",
        })
        .expect(400, {
          errorCode: "VALIDATION_ERROR",
          errors: [
            {
              block: "body",
              instancePath: "/data",
              keyword: "format",
              message: 'must match format "f1"',
              params: {
                format: "f1",
              },
              schemaPath: "#/properties/data/format",
            },
            {
              block: "body",
              instancePath: "/data2",
              keyword: "format",
              message: 'must match format "f2"',
              params: {
                format: "f2",
              },
              schemaPath: "#/properties/data2/format",
            },
            {
              block: "body",
              instancePath: "/data3",
              keyword: "format",
              message: 'must match format "f3"',
              params: {
                format: "f3",
              },
              schemaPath: "#/properties/data3/format",
            },
          ],
          message: "Validation failed",
        });
    });
  });

  Deno.test(`[VALIDATION] [${Testing.name}] Validation error aggregation`, async () => {
    const app = new Planigale();
    const validator = new SchemaValidator();
    app.use(bodyParser);
    app.use(validator.middleware);
    app.route({
      method: "POST",
      url: "/validation/:id",
      schema: {
        body: {
          type: "object",
          required: ["data"],
          properties: {
            data: { type: "string" },
          },
        },
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "number" },
          },
        },
        headers: {
          type: "object",
          required: ["authorization"],
          properties: {
            authorization: {
              type: "string",
              pattern: "[Bb]earer .*",
            },
          },
        },
        query: {
          type: "object",
          required: ["asd"],
          properties: {
            asd: { type: "number" },
          },
        },
      },
      handler: async (_req: Req) => {
        throw new Error("Should not be called");
      },
    });

    await Agent.server(app, async (agent) => {
      await agent.request()
        .post("/validation/asd?asd=test")
        .json({ other: "oko" })
        .header("authorization", "token")
        .expect(400, {
          errorCode: "VALIDATION_ERROR",
          message: "Validation failed",
          errors: [
            {
              block: "body",
              instancePath: "",
              keyword: "required",
              message: "must have required property 'data'",
              params: {
                missingProperty: "data",
              },
              schemaPath: "#/required",
            },
            {
              block: "params",
              instancePath: "/id",
              keyword: "type",
              message: "must be number",
              params: {
                type: "number",
              },
              schemaPath: "#/properties/id/type",
            },
            {
              block: "query",
              instancePath: "/asd",
              keyword: "type",
              message: "must be number",
              params: {
                type: "number",
              },
              schemaPath: "#/properties/asd/type",
            },
            {
              block: "headers",
              instancePath: "/authorization",
              keyword: "pattern",
              message: 'must match pattern "[Bb]earer .*"',
              params: {
                pattern: "[Bb]earer .*",
              },
              schemaPath: "#/properties/authorization/pattern",
            },
          ],
        });
    });
  });
  Deno.test(`[VALIDATION] [${Testing.name}] Validation add keyword`, async () => {
    const app = new Planigale();
    const validator = new SchemaValidator();
    validator.addKeyword({
      keyword: "customKeyword",
      type: "object",
      validate: () => {
        return false;
      },
    });
    app.use(bodyParser);
    app.use(validator.middleware);
    app.route({
      method: "POST",
      url: "/validation",
      schema: {
        body: {
          type: "object",
          customKeyword: true,
        },
      },
      handler: async (_req: Req) => {
        throw new Error("Should not be called");
      },
    });

    await Agent.server(app, async (agent) => {
      await agent.request()
        .post("/validation")
        .json({ other: "oko" })
        .header("authorization", "token")
        .expect(400, {
          errorCode: "VALIDATION_ERROR",
          errors: [
            {
              block: "body",
              instancePath: "",
              keyword: "customKeyword",
              message: 'must pass "customKeyword" keyword validation',
              params: {},
              schemaPath: "#/customKeyword",
            },
          ],
          message: "Validation failed",
        });
    });
  });
});
