import { Agent } from "@planigale/testing";
import * as mime from "@std/media-types";
import { assert, assertEquals } from "@std/assert";
import * as path from "@std/path";

import config from "./config.ts";
import { buildApp } from "../src/interfaces/http/mod.ts";
import { initStorage } from "../src/core/mod.ts";

Deno.env.set("ENV_TYPE", "test");

const storage = initStorage(config);
const app = await buildApp(storage);

const __dirname = new URL(".", import.meta.url).pathname;

Deno.test({
  name: "POST /files - with progress",
  ignore: Deno.env.get("OFFLINE") === "true",
  fn: async () => {
    const agent = new Agent(app);
    await agent.useServer();
    try {
      const filePath = "test.txt";
      const file = await Deno.open(path.join(__dirname, filePath));
      const contentType = mime.contentType(path.extname(filePath));
      const fileInfo = await file.stat();
      // log progress based on blob.size in pipe
      let uploadedSize = 0;
      const points: number[] = [];
      const blobStream = file.readable.pipeThrough(
        new TransformStream({
          start() {},
          transform(chunk, controller) {
            const size = chunk.length;
            let i = 0;
            for (i = 0; i < size; i += 10) {
              const p = chunk.slice(i, i + 10);
              uploadedSize += p.length;
              points.push(uploadedSize / fileInfo.size * 100);
              controller.enqueue(p);
            }
          },
          flush() {
            // no-op
          },
        }),
      );
      const res = await agent.fetch(new URL("/", agent.addr), {
        method: "POST",
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Content-Length": fileInfo.size.toString(),
          "Content-Disposition": `attachment; filename="${
            path.basename(filePath)
          }"`,
        },
        body: blobStream,
      });
      res.body?.cancel();
      let lastPoint = 0;
      for (const point of points) {
        assert(point >= lastPoint);
        lastPoint = point;
      }
      assertEquals(lastPoint, 100);
      assertEquals(res.status, 200);
    } finally {
      await agent.close();
    }
  },
});
