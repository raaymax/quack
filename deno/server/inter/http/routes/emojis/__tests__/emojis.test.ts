import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";
import { Emoji } from "../../../../../types.ts";
import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";
import { ensureUser, login } from "../../__tests__/mod.ts";

const { app, repo, core } = createApp();

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

// Records the storageIds produced by storage.upload while `fn` runs, so a test
// can assert a rejected request cleaned up the blob it uploaded.
async function trackUploads(fn: () => Promise<void>): Promise<string[]> {
  const ids: string[] = [];
  const original = core.storage.upload.bind(core.storage);
  core.storage.upload = (async (...args: Parameters<typeof original>) => {
    const id = await original(...args);
    ids.push(id);
    return id;
  }) as typeof core.storage.upload;
  try {
    await fn();
  } finally {
    core.storage.upload = original;
  }
  return ids;
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
      // The blob is uploaded before the duplicate check runs; it must be
      // cleaned up so a rejected create does not leak storage.
      const uploaded = await trackUploads(async () => {
        await agent.request()
          .post("/api/emojis/dup")
          .file(png)
          .header("Authorization", `Bearer ${token}`)
          .expect(409);
      });
      assertEquals(uploaded.length, 1);
      assertEquals(await core.storage.exists(uploaded[0]), false);
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

Deno.test("PUT /api/emojis - replaces image and removes old blob", async () => {
  await withPng(async (png) => {
    const agent = await Agent.from(app);
    try {
      const { token } = await login(repo, agent, "admin");
      const created = await agent.request()
        .post("/api/emojis/swap")
        .file(png)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      const oldFileId = (await created.json()).emoji.fileId;
      assert(await core.storage.exists(oldFileId));

      const replaced = await agent.request()
        .put("/api/emojis/swap")
        .file(png)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      const newFileId = (await replaced.json()).emoji.fileId;

      assert(newFileId !== oldFileId);
      assert(!(await core.storage.exists(oldFileId)));
      assert(await core.storage.exists(newFileId));
    } finally {
      await repo.emoji.removeMany({ shortname: ":swap:" });
      await agent.close();
    }
  });
});

Deno.test("PUT /api/emojis - replacing a missing emoji is 404", async () => {
  await withPng(async (png) => {
    const agent = await Agent.from(app);
    try {
      const { token } = await login(repo, agent, "admin");
      const uploaded = await trackUploads(async () => {
        await agent.request()
          .put("/api/emojis/ghost")
          .file(png)
          .header("Authorization", `Bearer ${token}`)
          .expect(404);
      });
      assertEquals(uploaded.length, 1);
      assertEquals(await core.storage.exists(uploaded[0]), false);
    } finally {
      await agent.close();
    }
  });
});

Deno.test("PUT /api/emojis - unauthorized", async () => {
  const agent = await Agent.from(app);
  try {
    await agent.request()
      .put("/api/emojis/swap")
      .text("img")
      .expect(401);
  } finally {
    await agent.close();
  }
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
