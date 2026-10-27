import { assertEquals } from "@std/assert";
import { parse, stringify } from "./mod.ts";

Deno.test("should serialize and deserialize - numnber parsing", async () => {
  const params = {
    test: 112,
    oko: "test",
    deep: {
      test: 1,
      test2: 2,
    },
  };

  const str = stringify(params);
  const obj = parse(str, { parseNumbers: true });
  assertEquals(str, "test=112&oko=test&deep[test]=1&deep[test2]=2");
  assertEquals(obj, params);
});

Deno.test("should serialize and deserialize - no numbers", async () => {
  const params = {
    test: 112,
    oko: "test",
    deep: {
      test: 1,
      test2: 2,
    },
  };

  const expected = {
    test: "112",
    oko: "test",
    deep: {
      test: "1",
      test2: "2",
    },
  };

  const str = stringify(params);
  const obj = parse(str, { parseNumbers: false });
  assertEquals(str, "test=112&oko=test&deep[test]=1&deep[test2]=2");
  assertEquals(obj, expected);
});
