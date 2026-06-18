import { Agent } from "@planigale/testing";
import { assert, assertEquals } from "@std/assert";
import * as path from "@std/path";
import { PhotonImage } from "@cf-wasm/photon/node";

import { buildApp } from "../src/interfaces/http/mod.ts";
import { initStorage } from "../src/core/mod.ts";
import config from "./config.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const testImagePath = path.join(__dirname, "quack.png");

const storage = initStorage(config);
const app = await buildApp(storage);

const upload = async () => {
  const agent = await Agent.from(app);
  const res = await agent.request().post("/").file(testImagePath).expect(200);
  const body = await res.json();
  return body.id as string;
};

Deno.test("GET /:id?w - serves a thumbnail decoded at the requested width", async () => {
  const fileId = await upload();
  const agent = await Agent.from(app);
  const res = await agent.request().get(`/${fileId}?w=100`).expect(200);
  assertEquals(res.headers.get("content-type"), "image/png");

  const bytes = new Uint8Array(await res.arrayBuffer());
  const img = PhotonImage.new_from_byteslice(bytes);
  assertEquals(img.get_width(), 100);
  assert(img.get_height() > 0 && img.get_height() < 151, "height scaled down");
  img.free();
});

Deno.test("GET /:id?w - caches the generated thumbnail under its sized id", async () => {
  const fileId = await upload();
  const agent = await Agent.from(app);

  const warm = await agent.request().get(`/${fileId}?w=100`).expect(200);
  await warm.body?.cancel?.();

  const cached = await agent.request().get(`/${fileId}-100x0`).expect(200);
  assertEquals(cached.headers.get("content-type"), "image/png");
  const bytes = new Uint8Array(await cached.arrayBuffer());
  const img = PhotonImage.new_from_byteslice(bytes);
  assertEquals(img.get_width(), 100);
  img.free();
});

Deno.test("GET /:id?w - repeated requests return identical cached bytes", async () => {
  const fileId = await upload();
  const agent = await Agent.from(app);

  const first = new Uint8Array(
    await (await agent.request().get(`/${fileId}?w=120`).expect(200))
      .arrayBuffer(),
  );
  const second = new Uint8Array(
    await (await agent.request().get(`/${fileId}?w=120`).expect(200))
      .arrayBuffer(),
  );
  assertEquals(first, second);
});
