import { assertEquals } from "@std/assert";
import { Cache, CacheEntry } from "./cache.ts";
import { mergeRanges } from "./range.ts";

type Data = string[];

const merge = (a: CacheEntry<Data>, b: CacheEntry<Data>): CacheEntry<Data> => (
  new CacheEntry(Math.min(a.from, b.from), Math.max(a.to, b.to), [
    ...a.data,
    ...b.data,
  ])
);

const A = new CacheEntry(0, 1, ["A"]);
const B = new CacheEntry(3, 6, ["B"]);
const C = new CacheEntry(5, 10, ["C"]);
const D = new CacheEntry(11, 12, ["D"]);
const E = new CacheEntry(13, 16, ["D"]);
E.timestamp = new Date().getTime() - 1000 * 60 * 60 * 2;

Deno.test("[CacheEntry] merge", () => {
  assertEquals(
    mergeRanges(merge, A, B, C, D).toString(),
    "[0, 1]: [A],[3, 10]: [B,C],[11, 12]: [D]",
  );
});

Deno.test("[Cache] query from - bottom", () => {
  const result = new Cache<Data>(A, B, C, D).get({ from: 3 });
  assertEquals(result?.toString(), "[3, 10]: [B,C]");
});

Deno.test("[Cache] query from - top", () => {
  const result = new Cache<Data>(A, B, C, D).get({ from: 10 });
  assertEquals(result, null);
});
Deno.test("[Cache] query from - outside", () => {
  const result = new Cache<Data>(A, B, C, D).get({ from: 2 });
  assertEquals(result, null);
});

Deno.test("[Cache] query from - inside", () => {
  const result = new Cache<Data>(A, B, C, D).get({ from: 4 });
  assertEquals(result?.toString(), "[3, 10]: [B,C]");
});

Deno.test("[Cache] query to - bottom", () => {
  const result = new Cache<Data>(A, B, C, D).get({ to: 3 });
  assertEquals(result, null);
});

Deno.test("[Cache] query to - top", () => {
  const result = new Cache<Data>(A, B, C, D).get({ to: 10 });
  assertEquals(result?.toString(), "[3, 10]: [B,C]");
});
Deno.test("[Cache] query to - outside", () => {
  const result = new Cache<Data>(A, B, C, D).get({ to: 2 });
  assertEquals(result, null);
});

Deno.test("[Cache] query to - inside", () => {
  const result = new Cache<Data>(A, B, C, D).get({ to: 4 });
  assertEquals(result?.toString(), "[3, 10]: [B,C]");
});

Deno.test("[Cache] query range - bottom", () => {
  const result = new Cache<Data>(A, B, C, D).get({ from: 3, to: 7 });
  assertEquals(result?.toString(), "[3, 10]: [B,C]");
});

Deno.test("[Cache] query range - top", () => {
  const result = new Cache<Data>(A, B, C, D).get({ from: 4, to: 10 });
  assertEquals(result?.toString(), "[3, 10]: [B,C]");
});

Deno.test("[Cache] query range - outside", () => {
  const result = new Cache<Data>(A, B, C, D).get({ from: 15, to: 20 });
  assertEquals(result, null);
});

Deno.test("[Cache] query range - inside", () => {
  const result = new Cache<Data>(A, B, C, D).get({ from: 4, to: 6 });
  assertEquals(result?.toString(), "[3, 10]: [B,C]");
});

Deno.test("[Cache] query range - holes", () => {
  const result = new Cache<Data>(A, B, C, D).get({ from: 0, to: 12 });
  assertEquals(result, null);
});

Deno.test("[Cache] query range - holes", () => {
  const result = new Cache<Data>(A, B, C, D).get({ from: 4, to: 11 });
  assertEquals(result, null);
});

Deno.test("[Cache] query range - holes", () => {
  const result = new Cache<Data>(A, B, C, D).get({ from: 1, to: 5 });
  assertEquals(result, null);
});

Deno.test("[Cache] invalidate", () => {
  const cache = new Cache<Data>(A, B, C, D);
  cache.invalidate();
  assertEquals(cache.repo.length, 0);
});

Deno.test("[Cache] cleanup", () => {
  const cache = new Cache<Data>(A, B, C, D, E);
  cache.cleanup();
  assertEquals(cache.get({ from: 3, to: 4 })?.toString(), "[3, 10]: [B,C]");
  assertEquals(cache.get({ from: 14, to: 15 }), null);
});

Deno.test("[Cache] add entry", () => {
  const cache = new Cache<Data>(A, C, D);
  assertEquals(cache.get({ from: 3, to: 4 }), null);
  cache.addEntry(B);
  assertEquals(cache.get({ from: 3, to: 4 })?.toString(), "[3, 10]: [B,C]");
});
