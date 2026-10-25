import { assertEquals, assertThrows } from "@std/assert";
import { resolveClientIp, trustMatcher } from "../clientIp.ts";

const resolve = (
  peer: string,
  forwardedFor: string | undefined,
  trust: Parameters<typeof trustMatcher>[0],
) => resolveClientIp(peer, forwardedFor, trustMatcher(trust));

Deno.test("clientIp - ignores X-Forwarded-For from untrusted peers", () => {
  assertEquals(resolve("203.0.113.7", "1.2.3.4", ["loopback"]), "203.0.113.7");
  assertEquals(resolve("10.0.0.2", "1.2.3.4", false), "10.0.0.2");
});

Deno.test("clientIp - walks trusted proxies from the right", () => {
  const trust = ["loopback", "linklocal", "uniquelocal"];
  assertEquals(resolve("10.0.0.2", "1.2.3.4", trust), "1.2.3.4");
  assertEquals(
    resolve("127.0.0.1", "6.6.6.6, 1.2.3.4, 172.16.5.5", trust),
    "1.2.3.4",
  );
  assertEquals(resolve("::ffff:127.0.0.1", "1.2.3.4", trust), "1.2.3.4");
  assertEquals(resolve("::1", "2001:DB8::1", trust), "2001:db8::1");
});

Deno.test("clientIp - supports hop counts, booleans and CIDR ranges", () => {
  assertEquals(resolve("10.0.0.2", "6.6.6.6, 1.2.3.4", 1), "1.2.3.4");
  assertEquals(resolve("10.0.0.2", "6.6.6.6, 1.2.3.4", 2), "6.6.6.6");
  assertEquals(resolve("10.0.0.2", "6.6.6.6, 1.2.3.4", true), "6.6.6.6");
  assertEquals(
    resolve("35.191.0.9", "1.2.3.4", ["35.191.0.0/16"]),
    "1.2.3.4",
  );
  assertEquals(
    resolve("35.192.0.9", "1.2.3.4", ["35.191.0.0/16"]),
    "35.192.0.9",
  );
  assertEquals(resolve("localhost", undefined, ["loopback"]), "127.0.0.1");
});

Deno.test("clientIp - rejects invalid trust entries", () => {
  assertThrows(() => trustMatcher(["not-an-ip"]));
  assertThrows(() => trustMatcher(["loopback, uniquelocal"]));
});
