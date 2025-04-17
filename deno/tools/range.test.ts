import { assertEquals } from "@std/assert";
import { mergeRanges, Range } from "./range.ts";

Deno.test("[Range] A <> [] B", () => {
  const A = new Range(1, 2);
  const B = new Range(3, 4);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), false);
  assertEquals(A.equal(B), false);
});

Deno.test("[Range] B <> [] A", () => {
  const A = new Range(3, 4);
  const B = new Range(1, 2);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), false);
  assertEquals(A.equal(B), false);
});

Deno.test("[Range] A <>[] B", () => {
  const A = new Range(1, 3);
  const B = new Range(3, 4);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("[Range] B <>[] A", () => {
  const A = new Range(3, 4);
  const B = new Range(1, 3);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("[Range] A <[>] B", () => {
  const A = new Range(1, 4);
  const B = new Range(2, 5);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});
Deno.test("[Range] B <[>] A", () => {
  const A = new Range(2, 5);
  const B = new Range(1, 4);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("[Range] A [=] B", () => {
  const A = new Range(2, 4);
  const B = new Range(2, 4);
  assertEquals(A.containsEntirely(B), true);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), true);
});

Deno.test("[Range] A []> B", () => {
  const A = new Range(2, 5);
  const B = new Range(2, 4);
  assertEquals(A.containsEntirely(B), true);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});
Deno.test("[Range] A <[] B", () => {
  const A = new Range(1, 4);
  const B = new Range(2, 4);
  assertEquals(A.containsEntirely(B), true);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("[Range] A <[]> B", () => {
  const A = new Range(1, 4);
  const B = new Range(2, 3);
  assertEquals(A.containsEntirely(B), true);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("[Range] A [<>] B", () => {
  const A = new Range(2, 3);
  const B = new Range(1, 4);
  assertEquals(A.containsEntirely(B), false);
  assertEquals(A.overlaps(B), true);
  assertEquals(A.equal(B), false);
});

Deno.test("[Range] containsPoint", () => {
  const B = new Range(2, 4);
  assertEquals(B.containsPoint(1), false);
  assertEquals(B.containsPoint(2), true);
  assertEquals(B.containsPoint(3), true);
  assertEquals(B.containsPoint(4), true);
  assertEquals(B.containsPoint(5), false);
});
Deno.test("[Range] containsPointTo", () => {
  const B = new Range(2, 4);
  assertEquals(B.containsPointTo(1), false);
  assertEquals(B.containsPointTo(2), false);
  assertEquals(B.containsPointTo(3), true);
  assertEquals(B.containsPointTo(4), true);
  assertEquals(B.containsPointTo(5), false);
});

Deno.test("[Range] containsPointFrom", () => {
  const B = new Range(2, 4);
  assertEquals(B.containsPointFrom(1), false);
  assertEquals(B.containsPointFrom(2), true);
  assertEquals(B.containsPointFrom(3), true);
  assertEquals(B.containsPointFrom(4), false);
  assertEquals(B.containsPointFrom(5), false);
});

Deno.test("[Range] params order", () => {
  const A = new Range(1, 2);
  const B = new Range(2, 1);
  assertEquals(A.from, B.from);
  assertEquals(A.to, B.to);
});

Deno.test("[Range] toString", () => {
  const A = new Range(1, 2);
  const B = new Range(12345678, 23456789);
  assertEquals(A.toString(), "[1, 2]");
  assertEquals(B.toString(), "[12_345_678, 23_456_789]");
});

const merge = (a: Range, b: Range): Range => (
  new Range(Math.min(a.from, b.from), Math.max(a.to, b.to))
);

Deno.test("[Range] merge", () => {
  const A = new Range(1, 2);
  const B = new Range(3, 4);
  assertEquals(mergeRanges(merge, A, B), [A, B]);
});

Deno.test("[Range] merge", () => {
  const A = new Range(1, 2);
  const B = new Range(2, 4);
  assertEquals(mergeRanges(merge, A, B).toString(), "[1, 4]");
});

Deno.test("[Range] merge", () => {
  const A = new Range(1, 2);
  const B = new Range(3, 6);
  const C = new Range(5, 10);
  const D = new Range(11, 12);
  assertEquals(
    mergeRanges(merge, A, B, C, D).toString(),
    "[1, 2],[3, 10],[11, 12]",
  );
});
