import { Agent } from "@planigale/testing";
import { assert, assertEquals } from "@std/assert";
import * as path from "@std/path";

import config, { type Config } from "@quack/config";
import { buildApp } from "../src/interfaces/http/mod.ts";
import { initStorage } from "../src/core/mod.ts";

const storage = initStorage(config);
const app = await buildApp(storage);

const __dirname = new URL(".", import.meta.url).pathname;
const testTextFilePath = path.join(__dirname, "test.txt");
const testImagePath = path.join(__dirname, "quack.png");

const configs: (Config["storage"] & {ignore?: boolean})[] = [
  {
    type: "fs",
    directory: "tests/uploads",
  },
  {
    type: "memory",
  },
  {
    type: "gcs",
    bucket: "codecat-quack-integration-test",
    ignore: Deno.env.get("local") !== "true" ||
      Deno.env.get("OFFLINE") === "true",
  },
];

for (const config of configs) {
  if (config.ignore) {
    continue;
  }

  const TYPE = config.type.toUpperCase();

  Deno.test(`[${TYPE}] text file upload and download`, async (t) => {
    storage.init(config);
    let fileId: string | null = null;
    await t.step("POST / - upload file", async () => {
      const agent = await Agent.from(app);
      const res = await agent.request()
        .post("/")
        .file(testTextFilePath)
        .expect(200);

      const body = await res.json();
      assertEquals(body.status, "ok");
      assert(typeof body.id === "string");
      fileId = body.id;
    });

    await t.step("GET /:id - download file", async () => {
      const agent = await Agent.from(app);
      const res = await agent.request()
        .get(`/${fileId}?download=true`)
        .expect(200);
      const file = await Deno.readFile(testTextFilePath);
      // const body = await res.arrayBuffer();
      await res.body?.cancel?.();
      // assertEquals(new Uint8Array(body), file, 'file should be the same');
      assertEquals(
        res.headers.get("content-type"),
        "text/plain; charset=UTF-8",
      );
      assertEquals(
        res.headers.get("content-length"),
        file.byteLength.toString(),
      );
      assertEquals(
        res.headers.get("content-disposition"),
        'attachment; filename="test.txt"',
      );
    });

    await t.step("GET /:id - get file", async () => {
      const agent = await Agent.from(app);
      const res = await agent.request()
        .get(`/${fileId}`)
        .expect(200);
      const file = await Deno.readFile(testTextFilePath);
      // const body = await res.arrayBuffer();
      await res.body?.cancel?.();
      // assertEquals(new Uint8Array(body), file, 'file should be the same');
      assertEquals(
        res.headers.get("content-type"),
        "text/plain; charset=UTF-8",
      );
      assertEquals(
        res.headers.get("content-length"),
        file.byteLength.toString(),
      );
      assertEquals(
        res.headers.has("content-disposition"),
        false,
      );
    });

    await t.step("DELETE /:id", async () => {
      const agent = await Agent.from(app);
      await agent.request()
        .delete(`/${fileId}`)
        .emptyBody()
        .expect(204);
      const res = await agent.request()
        .get(`/${fileId}`)
        .expect(404);
      const body = await res.json();
      assertEquals(body.errorCode, "RESOURCE_NOT_FOUND");
    });
  });

  Deno.test(`[${TYPE}] image upload and download`, async (t) => {
    storage.init(config);
    let fileId: string | null = null;
    await t.step("POST / - upload file", async () => {
      const agent = await Agent.from(app);
      const res = await agent.request()
        .post("/")
        .file(testImagePath)
        .expect(200);

      const body = await res.json();
      assertEquals(body.status, "ok");
      assert(typeof body.id === "string");
      fileId = body.id;
    });

    await t.step("GET /:id - download file", async () => {
      const agent = await Agent.from(app);
      const res = await agent.request()
        .get(`/${fileId}?download=true`)
        .expect(200);
      const file = await Deno.readFile(testImagePath);
      // const body = await res.arrayBuffer();
      await res.body?.cancel?.();
      // assertEquals(new Uint8Array(body), file, 'file should be the same');
      assertEquals(res.headers.get("content-type"), "image/png");
      assertEquals(
        res.headers.get("content-length"),
        file.byteLength.toString(),
      );
      assertEquals(
        res.headers.get("content-disposition"),
        'attachment; filename="quack.png"',
      );
    });

    await t.step("GET /:id - get file", async () => {
      const agent = await Agent.from(app);
      const file = await Deno.readFile(testImagePath);
      const res = await agent.request()
        .get(`/${fileId}`)
        .expect(200);
      const body = await res.arrayBuffer();

      // const reader = await res.body?.getReader()
      // const data = await reader?.read();
      // await reader?.cancel();
      // reader?.releaseLock();

      // await res.body?.cancel?.();
      // assertEquals(new Uint8Array(body), file, 'file should be the same');
      assertEquals(res.headers.get("content-type"), "image/png");
      assertEquals(
        res.headers.get("content-length"),
        file.byteLength.toString(),
      );
      assertEquals(
        res.headers.has("content-disposition"),
        false,
      );
    });

    await t.step("GET /:id - get image scaled", async () => {
      const agent = await Agent.from(app);
      const file = await Deno.readFile(testImagePath);
      const res = await agent.request()
        .get(`/${fileId}?w=10&h=10`)
        .expect(200);
      // const body = await res.arrayBuffer();
      await res.body?.cancel?.();
      /* assert(
        body.byteLength < file.byteLength,
        "scaled image should be smaller",
      ); */
      assertEquals(res.headers.get("content-type"), "image/png");
      /* assertEquals(
        res.headers.get("content-length"),
        body.byteLength.toString(),
      ); */
    });

    await t.step("GET /:id - miniature image should exist ", async () => {
      const agent = await Agent.from(app);
      const res = await agent.request()
        .get(`/${fileId}-10x10`)
        .expect(200);
      const file = await Deno.readFile(testImagePath);
      // const body = await res.arrayBuffer();
      await res.body?.cancel?.();
      /* assert(
        body.byteLength < file.byteLength,
        "scaled image should be smaller",
      ); */
      assertEquals(res.headers.get("content-type"), "image/png");
      /* assertEquals(
        res.headers.get("content-length"),
        body.byteLength.toString(),
      ); */
    });

    await t.step("GET /:id - 404 when not exists", async () => {
      const agent = await Agent.from(app);
      const res = await agent.request()
        .get("/none-10x10")
        .expect(404);
      await res.body?.cancel?.();
    });

    await t.step("DELETE /:id - miniature", async () => {
      const agent = await Agent.from(app);
      await agent.request()
        .delete(`/${fileId}-10x10`)
        .emptyBody()
        .expect(204);
      const res = await agent.request()
        .get(`/${fileId}-10x10`)
        .expect(404);
      const body = await res.json();
      assertEquals(body.errorCode, "RESOURCE_NOT_FOUND");
    });

    await t.step("DELETE /:id - file", async () => {
      const agent = await Agent.from(app);
      await agent.request()
        .delete(`/${fileId}`)
        .emptyBody()
        .expect(204);
      const res = await agent.request()
        .get(`/${fileId}`)
        .expect(404);
      const body = await res.json();
      assertEquals(body.errorCode, "RESOURCE_NOT_FOUND");
    });
  });
}
