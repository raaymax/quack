import { assertEquals } from "@std/assert";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";
import API from "@quack/api";

Deno.env.set("ENV_TYPE", "test");

const { app, repo, core } = createApp();

Deno.test("GET /auth/session - No session", async () => {
  await Chat.test(app, { type: "http" }, async (agent) => {
    const api = new API(agent.addr, { fetch: agent.fetch, sse: false });
    const session = await api.auth.login({ email: "admin", password: "123" });
    assertEquals(session.status, "ok");
  });
});
