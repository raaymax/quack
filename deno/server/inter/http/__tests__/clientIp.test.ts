import { assertEquals, assertThrows } from "@std/assert";
import { resolveClientIp, trustedHops } from "../clientIp.ts";

Deno.test("clientIp - ignores X-Forwarded-For without trusted proxies", () => {
  assertEquals(resolveClientIp("203.0.113.7", "1.2.3.4", 0), "203.0.113.7");
  assertEquals(resolveClientIp("203.0.113.7", undefined, 0), "203.0.113.7");
});

Deno.test("clientIp - skips the trusted proxies from the right", () => {
  assertEquals(resolveClientIp("10.0.0.2", "1.2.3.4", 1), "1.2.3.4");
  assertEquals(
    resolveClientIp("10.0.0.2", "6.6.6.6, 1.2.3.4, 172.16.5.5", 2),
    "1.2.3.4",
  );
});

Deno.test("clientIp - spoofed entries on the left are never used", () => {
  assertEquals(
    resolveClientIp("10.0.0.2", "6.6.6.6, 1.2.3.4", 1),
    "1.2.3.4",
  );
});

Deno.test("clientIp - falls back to the left-most entry on short chains", () => {
  assertEquals(resolveClientIp("10.0.0.2", "1.2.3.4", 3), "1.2.3.4");
  assertEquals(resolveClientIp("10.0.0.2", " , ", 1), "10.0.0.2");
});

Deno.test("clientIp - trustProxy must be a non-negative integer", () => {
  assertEquals(trustedHops(undefined), 0);
  assertEquals(trustedHops(2), 2);
  assertThrows(() => trustedHops(-1));
  assertThrows(() => trustedHops(1.5));
  assertThrows(() => trustedHops("uniquelocal"));
  assertThrows(() => trustedHops(true));
});
