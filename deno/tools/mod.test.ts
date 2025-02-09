import { assertEquals } from "@std/assert";
import { Range } from "./mod.ts";

Deno.test("A <> [] B", () => {
  const A = new Range(1, 2);
  const B = new Range(3, 4);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), false);
  assertEquals(A.equal(B), false);
});

Deno.test("B <> [] A", () => {
  const A = new Range(3, 4);
  const B = new Range(1, 2);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), false);
  assertEquals(A.equal(B), false);
});

Deno.test("A <>[] B", () => {
  const A = new Range(1, 3);
  const B = new Range(3, 4);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("B <>[] A", () => {
  const A = new Range(3, 4);
  const B = new Range(1, 3);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("A <[>] B", () => {
  const A = new Range(1, 4);
  const B = new Range(2, 5);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});
Deno.test("B <[>] A", () => {
  const A = new Range(2, 5);
  const B = new Range(1, 4);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("A [=] B", () => {
  const A = new Range(2, 4);
  const B = new Range(2, 4);
  assertEquals(A.containsEntirely(B), true);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), true);
});

Deno.test("A []> B", () => {
  const A = new Range(2, 5);
  const B = new Range(2, 4);
  assertEquals(A.containsEntirely(B), true);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});
Deno.test("A <[] B", () => {
  const A = new Range(1, 4);
  const B = new Range(2, 4);
  assertEquals(A.containsEntirely(B), true);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("A <[]> B", () => {
  const A = new Range(1, 4);
  const B = new Range(2, 3);
  assertEquals(A.containsEntirely(B), true);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("A [<>] B", () => {
  const A = new Range(2, 3);
  const B = new Range(1, 4);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("params order", () => {
  const A = new Range(1, 2);
  const B = new Range(2, 1);
  assertEquals(A.from, B.from);
  assertEquals(A.to, B.to);
});

Deno.test("toString", () => {
  const A = new Range(1, 2);
  const B = new Range(12345678, 23456789);
  assertEquals(A.toString(), "[1, 2]");
  assertEquals(B.toString(), "[12_345_678, 23_456_789]");
});
