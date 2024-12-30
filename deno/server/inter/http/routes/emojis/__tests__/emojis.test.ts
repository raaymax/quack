import { assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { Emoji } from "../../../../../types.ts";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";
import { ensureUser } from "../../__tests__/mod.ts";

const { app, repo } = createApp();

Deno.test("GET /api/emojis - unauthorized", async () => {
  const agent = await Agent.from(app);
  try {
    await agent.request().get("/api/emojis").expect(401);
  } finally {
    await agent.close();
  }
});

Deno.test("GET /api/emojis - getAllEmojis empty list", async () => {
  await ensureUser(repo, "member", { name: "Member" });
  await Chat.test(app, { type: "handler" }, async (agent) => {
    await Chat.init(repo, agent)
      .login("member")
      .getEmojis(async (emojis: Emoji[]) => {
        assertEquals(emojis, []);
      })
      .end();
  });
});

Deno.test("Adding emojis and listing them", async () => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const fileId = crypto.randomUUID();
    try {
      await Chat.init(repo, agent)
        .login("member")
        .connectSSE()
        .executeCommand("/emoji :smile:", [{
          id: fileId,
          fileName: "smile.png",
          contentType: "image/png",
        }])
        .nextEvent((event: any) => {
          assertEquals(event.type, "emoji");
          assertEquals(event.shortname, ":smile:");
        })
        .getEmojis(async (emojis: Emoji[]) => {
          assertEquals(emojis.length, 1);
          assertEquals(emojis[0].shortname, ":smile:");
          assertEquals(emojis[0].fileId, fileId);
        })
        .end();
    } finally {
      await repo.emoji.removeMany({ shortname: ":smile:" });
    }
  });
});
