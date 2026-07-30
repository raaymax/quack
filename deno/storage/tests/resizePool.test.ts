import { assert, assertEquals } from "@std/assert";
import * as path from "@std/path";
import { PhotonImage } from "@cf-wasm/photon/node";

import { ResizePool } from "../src/core/resizePool.ts";

const __dirname = new URL(".", import.meta.url).pathname;
const testImagePath = path.join(__dirname, "quack.png");
const source = await Deno.readFile(testImagePath);

const dimensions = (bytes: Uint8Array<ArrayBuffer>) => {
  const img = PhotonImage.new_from_byteslice(bytes);
  const size = { width: img.get_width(), height: img.get_height() };
  img.free();
  return size;
};

const original = dimensions(new Uint8Array(source));

const expectedHeight = (width: number) =>
  Math.max(1, Math.round((original.height / original.width) * width));

const expectedWidth = (height: number) =>
  Math.max(1, Math.round((original.width / original.height) * height));

Deno.test("ResizePool - resizes png by width and preserves aspect ratio", async () => {
  const pool = new ResizePool(2);
  try {
    const result = await pool.resize(new Uint8Array(source), 100, 0, true);
    assert(result, "should return resized bytes");
    assert(result.length > 0, "resized bytes should be non-empty");
    assert(
      result.length < source.length,
      "thumbnail should be smaller than the original",
    );
    assertEquals(dimensions(result), {
      width: 100,
      height: expectedHeight(100),
    });
  } finally {
    pool.close();
  }
});

Deno.test("ResizePool - resizes png by height only", async () => {
  const pool = new ResizePool(1);
  try {
    const result = await pool.resize(new Uint8Array(source), 0, 50, true);
    assert(result, "should return resized bytes");
    assertEquals(dimensions(result), { width: expectedWidth(50), height: 50 });
  } finally {
    pool.close();
  }
});

Deno.test("ResizePool - encodes jpeg output when not png", async () => {
  const pool = new ResizePool(1);
  try {
    const result = await pool.resize(new Uint8Array(source), 80, 0, false);
    assert(result, "should return resized bytes");
    assertEquals(result[0], 0xff, "jpeg magic byte 0");
    assertEquals(result[1], 0xd8, "jpeg magic byte 1");
    assertEquals(dimensions(result), { width: 80, height: expectedHeight(80) });
  } finally {
    pool.close();
  }
});

Deno.test("ResizePool - returns null for undecodable input", async () => {
  const pool = new ResizePool(1);
  try {
    const garbage = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const result = await pool.resize(garbage, 100, 0, true);
    assertEquals(result, null);
  } finally {
    pool.close();
  }
});

Deno.test("ResizePool - drains a queue larger than the pool", async () => {
  const pool = new ResizePool(1);
  try {
    const widths = [40, 60, 80, 120];
    const results = await Promise.all(
      widths.map((w) => pool.resize(new Uint8Array(source), w, 0, true)),
    );
    for (const [i, result] of results.entries()) {
      assert(result, `job ${i} should resolve`);
      assertEquals(dimensions(result).width, widths[i]);
    }
  } finally {
    pool.close();
  }
});

Deno.test("ResizePool - does not block the event loop", async () => {
  const pool = new ResizePool(2);
  let beats = 0;
  const heartbeat = setInterval(() => beats++, 5);
  try {
    const widths = [50, 90, 130, 170, 210, 250];
    const results = await Promise.all(
      widths.map((w) => pool.resize(new Uint8Array(source), w, 0, true)),
    );
    assert(results.every((r) => r !== null), "all resizes should succeed");
    assert(
      beats > 0,
      "event loop should keep ticking while resizing (blocking impl ticks 0)",
    );
  } finally {
    clearInterval(heartbeat);
    pool.close();
  }
});

Deno.test("ResizePool - reports no capacity beyond maxPending", async () => {
  const pool = new ResizePool(1, 2);
  try {
    assert(pool.hasCapacity(), "empty pool has capacity");
    const a = pool.resize(new Uint8Array(source), 100, 0, true);
    const b = pool.resize(new Uint8Array(source), 120, 0, true);
    assertEquals(pool.hasCapacity(), false);
    const [ra, rb] = await Promise.all([a, b]);
    assert(ra && rb, "both queued jobs should still complete");
    assert(pool.hasCapacity(), "drained pool has capacity again");
  } finally {
    pool.close();
  }
});

Deno.test("ResizePool - times out a stuck job and stays usable", async () => {
  const pool = new ResizePool(1, 4, 1);
  try {
    const first = await pool.resize(new Uint8Array(source), 100, 0, true);
    assertEquals(first, null, "the job should time out to null");

    let guard: ReturnType<typeof setTimeout> | undefined;
    const stuck = new Promise<"stuck">((resolve) => {
      guard = setTimeout(() => resolve("stuck"), 3000);
    });
    const second = await Promise.race([
      pool.resize(new Uint8Array(source), 120, 0, true),
      stuck,
    ]);
    clearTimeout(guard);
    assertEquals(second, null, "pool must recover and not deadlock");
  } finally {
    pool.close();
  }
});

Deno.test("ResizePool - resolves pending work as null on close", async () => {
  const pool = new ResizePool(1);
  const inflight = pool.resize(new Uint8Array(source), 100, 0, true);
  const queued = pool.resize(new Uint8Array(source), 120, 0, true);
  pool.close();
  assertEquals(await inflight, null);
  assertEquals(await queued, null);
});
