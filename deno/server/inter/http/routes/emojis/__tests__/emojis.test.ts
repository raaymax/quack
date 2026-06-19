import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { Emoji } from "../../../../../types.ts";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";
import { ensureUser, login } from "../../__tests__/mod.ts";

const { app, repo } = createApp();

const PNG_BYTES = Uint8Array.from([
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a,
]);

async function withPng(fn: (path: string) => Promise<void>) {
  const path = await Deno.makeTempFile({ suffix: ".png" });
  await Deno.writeFile(path, PNG_BYTES);
  try {
    await fn(path);
  } finally {
    await Deno.remove(path).catch(() => {});
  }
}

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

Deno.test("POST /api/emojis - unauthorized", async () => {
  const agent = await Agent.from(app);
  try {
    await agent.request()
      .post("/api/emojis/wave")
      .text("img")
      .expect(401);
  } finally {
    await agent.close();
  }
});

Deno.test("POST /api/emojis - upload creates and lists emoji", async () => {
  await withPng(async (png) => {
    const agent = await Agent.from(app);
    try {
      const { token } = await login(repo, agent, "admin");
      const res = await agent.request()
        .post("/api/emojis/party")
        .file(png)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      const { emoji } = await res.json();
      assertEquals(emoji.shortname, ":party:");
      assert(emoji.fileId);

      const list = await agent.request()
        .get("/api/emojis")
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      const emojis = await list.json();
      assert(emojis.some((e: Emoji) => e.shortname === ":party:"));
    } finally {
      await repo.emoji.removeMany({ shortname: ":party:" });
      await agent.close();
    }
  });
});

Deno.test("POST /api/emojis - duplicate shortname rejected", async () => {
  await withPng(async (png) => {
    const agent = await Agent.from(app);
    try {
      const { token } = await login(repo, agent, "admin");
      await repo.emoji.create({
        shortname: ":dup:",
        fileId: crypto.randomUUID(),
      });
      await agent.request()
        .post("/api/emojis/dup")
        .file(png)
        .header("Authorization", `Bearer ${token}`)
        .expect(409);
    } finally {
      await repo.emoji.removeMany({ shortname: ":dup:" });
      await agent.close();
    }
  });
});

Deno.test("POST /api/emojis - non-image rejected", async () => {
  const agent = await Agent.from(app);
  try {
    const { token } = await login(repo, agent, "admin");
    await agent.request()
      .post("/api/emojis/txt")
      .text("not an image")
      .header("Authorization", `Bearer ${token}`)
      .expect(400);
  } finally {
    await repo.emoji.removeMany({ shortname: ":txt:" });
    await agent.close();
  }
});

Deno.test("POST /api/emojis - invalid shortname rejected", async () => {
  await withPng(async (png) => {
    const agent = await Agent.from(app);
    try {
      const { token } = await login(repo, agent, "admin");
      await agent.request()
        .post(`/api/emojis/${encodeURIComponent("bad name!")}`)
        .file(png)
        .header("Authorization", `Bearer ${token}`)
        .expect([400, 422]);
    } finally {
      await agent.close();
    }
  });
});

Deno.test("Adding emojis and listing them", async () => {
  await Chat.test(app, { type: "handler" }, async (agent) => {
    const fileId = crypto.randomUUID();
    try {
      await Chat.init(repo, agent)
        .login("member")
        .step(async () => {
          await repo.emoji.create({ shortname: ":smile:", fileId });
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
