import { assert, assertEquals } from "@std/assert";
import { Agent } from "@planigale/testing";

import { createApp } from "../../__tests__/app.ts";
import { Chat } from "../../__tests__/chat.ts";
import { login } from "../../__tests__/mod.ts";

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
    await admin.executeCommand("/main")
      .getConfig(async (body) => {
        assertEquals(body.appVersion, "1.2.3");
        assertEquals(body.mainChannelId, admin.channelId);
      })
      .end();
  });
});

Deno.test("PATCH /api/profile - unauthorized", async () => {
  const agent = await Agent.from(app);
  try {
    await agent.request()
      .patch("/api/profile")
      .json({ name: "Nope" })
      .expect(401);
  } finally {
    await agent.close();
  }
});

Deno.test("PATCH /api/profile - updates the name", async () => {
  const agent = await Agent.from(app);
  try {
    const { token } = await login(repo, agent, "profile-name");
    const res = await agent.request()
      .patch("/api/profile")
      .json({ name: "Renamed User" })
      .header("Authorization", `Bearer ${token}`)
      .expect(200);
    const { user } = await res.json();
    assertEquals(user.name, "Renamed User");
    assert(!("secrets" in user), "response must not leak secrets");
    assert(!("password" in user), "response must not leak password");

    const stored = await repo.user.getR({ email: "profile-name" });
    assertEquals(stored.name, "Renamed User");
  } finally {
    await agent.close();
  }
});

Deno.test("PATCH /api/profile - empty name rejected", async () => {
  const agent = await Agent.from(app);
  try {
    const { token } = await login(repo, agent, "profile-empty");
    await agent.request()
      .patch("/api/profile")
      .json({ name: "   " })
      .header("Authorization", `Bearer ${token}`)
      .expect([400, 422]);
  } finally {
    await agent.close();
  }
});

Deno.test("PUT /api/profile/avatar - unauthorized", async () => {
  await withPng(async (png) => {
    const agent = await Agent.from(app);
    try {
      await agent.request()
        .put("/api/profile/avatar")
        .file(png)
        .expect(401);
    } finally {
      await agent.close();
    }
  });
});

Deno.test("PUT /api/profile/avatar - sets avatarFileId", async () => {
  await withPng(async (png) => {
    const agent = await Agent.from(app);
    try {
      const { token } = await login(repo, agent, "avatar-set");
      const res = await agent.request()
        .put("/api/profile/avatar")
        .file(png)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      const { user } = await res.json();
      assert(user.avatarFileId, "avatarFileId should be set");
      assert(!("secrets" in user), "response must not leak secrets");
      assertEquals(await core.storage.exists(user.avatarFileId), true);
    } finally {
      await agent.close();
    }
  });
});

Deno.test("PUT /api/profile/avatar - non-image rejected", async () => {
  const agent = await Agent.from(app);
  try {
    const { token } = await login(repo, agent, "avatar-bad");
    await agent.request()
      .put("/api/profile/avatar")
      .text("not an image")
      .header("Authorization", `Bearer ${token}`)
      .expect(400);
  } finally {
    await agent.close();
  }
});

Deno.test("PUT /api/profile/avatar - replaces and removes the old blob", async () => {
  await withPng(async (png) => {
    const agent = await Agent.from(app);
    try {
      const { token } = await login(repo, agent, "avatar-swap");
      const first = await agent.request()
        .put("/api/profile/avatar")
        .file(png)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      const firstId = (await first.json()).user.avatarFileId;

      const second = await agent.request()
        .put("/api/profile/avatar")
        .file(png)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      const secondId = (await second.json()).user.avatarFileId;

      assert(firstId !== secondId, "a new blob should be stored");
      assertEquals(await core.storage.exists(firstId), false);
      assertEquals(await core.storage.exists(secondId), true);
    } finally {
      await agent.close();
    }
  });
});
