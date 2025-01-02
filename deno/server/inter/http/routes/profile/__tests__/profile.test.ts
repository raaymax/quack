import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";

import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";

const { app, repo, core } = createApp();

Deno.env.set("APP_VERSION", "1.2.3");

Deno.test("GET /api/profile/config - unauthorized", async () => {
  const agent = await Agent.from(app);
  try {
    await agent.request().get("/api/profile/config").expect(401);
  } finally {
    await agent.close();
  }
});

Deno.test("GET /api/profile/config - getConfig", async () => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const admin = Chat.init(repo, agent);
    await admin.login("admin")
      .createChannel({ name: "Test" });
    await admin.executeCommand("/main", [])
      .getConfig(async (body: any) => {
        assertEquals(body.appVersion, "1.2.3");
        assertEquals(body.mainChannelId, admin.channelId);
      })
      .end();
  });
});
