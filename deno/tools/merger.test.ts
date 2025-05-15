import { assertEquals } from "@std/assert";
import { merge, mergeFn } from "./merger.ts";

Deno.test("merge two lists by id", () => {
  const A = [{ id: 1 }, { id: 2 }];
  const B = [{ id: 2 }, { id: 3 }];
  const result = merge((a) => a.id.toString(), A, B);
  assertEquals(result, [{ id: 1 }, { id: 2 }, { id: 3 }]);
});

Deno.test("merge two lists by other properties", () => {
  const A = [{ id: 1, name: "a" }, { id: 2, name: "b" }];
  const B = [{ id: 3, name: "b" }, { id: 4, name: "c" }];
  const result = merge((a) => a.name, A, B);
  assertEquals(result, [{ id: 1, name: "a" }, { id: 3, name: "b" }, {
    id: 4,
    name: "c",
  }]);
});

Deno.test("merge two lists by id with merge function", () => {
  const A = [{ id: 1, name: "a" }, { id: 2, name: "b" }];
  const B = [{ id: 2, name: "bc" }, { id: 3, name: "c" }];
  const result = mergeFn(
    (a, b) => ({ ...a, ...b, name: a.name + b.name }),
    (a) => a.id.toString(),
    A,
    B,
  );
  assertEquals(result, [{ id: 1, name: "a" }, { id: 2, name: "bbc" }, {
    id: 3,
    name: "c",
  }]);
});
