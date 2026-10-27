import { Planigale } from "./app.ts";
import { InternalServerError } from "./errors.ts";
import { Res } from "./res.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test("[Res] res should work like Response", async () => {
  const app = new Planigale();
  app.route({
    method: "GET",
    url: "/",
    handler: () => {
      return Res.json({ message: "Hello World!" });
    },
  });
  const response = await app.handle(
    new Request("http://localhost:8000/", { method: "GET" }),
  );
  const body = await response.json();
  assertEquals(body, { message: "Hello World!" });
});

Deno.test("[Res] ability to set headers", async () => {
  const res = Res.json({ message: "Hello World!" });
  res.headers.set("x-test", "test");
  res.headers.set("x-test2", "test2");
  const response = res.toResponse();
  assertEquals(response.headers.get("x-test"), "test");
  assertEquals(response.headers.get("x-test2"), "test2");
});

Deno.test("[Res] ability to set cookies", async () => {
  const res = Res.json({ message: "Hello World!" });
  res.cookies.set("test", "test", { httpOnly: true, path: "/" });
  const response = res.toResponse();
  assertEquals(
    response.headers.get("Set-Cookie"),
    "test=test; HttpOnly; Path=/",
  );
});

Deno.test("[Res] headers and cookies", async () => {
  const res = Res.json({ message: "Hello World!" });
  res.cookies.set("test", "test", { httpOnly: true, path: "/" });
  res.headers.set("x-test", "test");
  const response = res.toResponse();
  assertEquals(
    response.headers.get("Set-Cookie"),
    "test=test; HttpOnly; Path=/",
  );
  assertEquals(response.headers.get("x-test"), "test");
});

Deno.test("[Res] file", async () => {
  const res = Res.file("./README.md");
  assertEquals(res.toResponse().status, 200);
  assertEquals(
    res.toResponse().headers.get("Content-Type"),
    "text/markdown; charset=UTF-8",
  );
  const r = res.toResponse();
  assert(r.body instanceof ReadableStream);
  r.body.cancel();
});

Deno.test("[Res] file not exists", async () => {
  const res = Res.file("./wrong.txt");
  assertEquals(res.toResponse().status, 404);
  assertEquals(
    res.toResponse().headers.get("Content-Type"),
    "application/json",
  );
  assertEquals(await res.toResponse().json(), { message: "Not Found" });
});

Deno.test("[Res] empty", async () => {
  const res = Res.empty();
  assertEquals(res.toResponse().status, 204);
  assertEquals(res.toResponse().body, null);
});

Deno.test("[Res] event stream", async () => {
  const res = new Res();
  const target = res.sendEvents();
  target.sendMessage({ data: "test" });
  const response = res.toResponse();
  assertEquals(response.headers.get("Content-Type"), "text/event-stream");
  assertEquals(response.headers.get("Cache-Control"), "no-cache");
  assertEquals(response.headers.get("Connection"), "keep-alive");
  assert(response.body instanceof ReadableStream);
  response.body.getReader().read().then(({ value }) => {
    assertEquals(new TextDecoder().decode(value), "data:test\n\n");
  });
  target.close();
});

Deno.test("[InternalServerError] serialization", async () => {
  const e1 = new InternalServerError(undefined);
  const e2 = new InternalServerError("Error");
  const e3 = new InternalServerError(null);
  const err = new Error("test");
  const e4 = new InternalServerError(err);
  assertEquals(e1.serialize(), {
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "undefined",
    originalError: undefined,
  });
  assertEquals(e2.serialize(), {
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "Error",
    originalError: "Error",
  });
  assertEquals(e3.serialize(), {
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "null",
    originalError: null,
  });
  assertEquals(e4.serialize(), {
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "test",
    originalError: err,
    stack: err.stack?.split("\n"),
  });
});
