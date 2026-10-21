import { Agent } from "@planigale/testing";
import { assert, assertEquals } from "@std/assert";
import { login, usingChannel } from "../../__tests__/mod.ts";
import { ChannelType, EntityId } from "../../../../../types.ts";
import { createApp, isRemote } from "../../__tests__/app.ts";

Deno.env.set("ENV_TYPE", "test");
const { app, repo, core } = createApp();

async function uploadFile(
  channelId: string,
  userId: string,
  fileName: string,
  contentType: string,
  contents: string,
) {
  const bytes = new TextEncoder().encode(contents);
  const storageId = await core.storage.upload(
    new Blob([bytes]).stream(),
    { filename: fileName, contentType, size: bytes.length },
  );
  const id = await core.dispatch({
    type: "file:register",
    body: {
      channelId,
      userId,
      storageId,
      fileName,
      contentType,
      size: bytes.length,
      resolution: null,
    },
  }).internal() as EntityId;
  return { storageId, fileId: id.toString() };
}

Deno.test("files - register draft, attach via message, list, remove", async () => {
  const agent = await Agent.from(app);
  try {
    const session = await login(repo, agent, "admin");
    const token = session.token;
    const admin = await repo.user.get({ email: "admin" });
    const userId = admin!.id.toString();

    await usingChannel(repo, {
      name: "files-test",
      channelType: ChannelType.PUBLIC,
      users: [EntityId.from(userId)],
    }, async (channelId) => {
      const { storageId, fileId } = await uploadFile(
        channelId,
        userId,
        "hello.txt",
        "text/plain",
        "hello world",
      );

      // A registered-but-unattached file is a draft: not in the channel list.
      let list = await core.file.getChannel({ userId, channelId });
      assertEquals(list.length, 0);

      // Sending a message that references the file attaches it and resolves
      // the file metadata onto the returned message.
      const res = await agent.request()
        .post(`/api/channels/${channelId}/messages`)
        .json({ flat: "see attached", fileIds: [fileId] })
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      const msg = await res.json();
      assertEquals(msg.files?.length, 1);
      assertEquals(msg.files[0].fileName, "hello.txt");
      assertEquals(msg.files[0].status, "attached");
      assert(
        !("storageId" in msg.files[0]),
        "storageId must not leak in message.files",
      );

      // Now attached -> appears in the per-channel files view.
      list = await core.file.getChannel({ userId, channelId });
      assertEquals(list.length, 1);
      assertEquals(list[0].id.toString(), fileId);

      // ... and over HTTP.
      const listRes = await agent.request()
        .get(`/api/channels/${channelId}/files`)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      const listBody = await listRes.json();
      assertEquals(listBody.length, 1);
      assertEquals(listBody[0].fileName, "hello.txt");
      assert(
        !("storageId" in listBody[0]),
        "storageId must not leak in the channel files list",
      );

      // Downloadable by entity id (storageId never leaves the server).
      const dl = await agent.request()
        .get(`/api/channels/${channelId}/files/${fileId}`)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      assertEquals(dl.headers.get("content-type"), "text/plain");
      assertEquals(await dl.text(), "hello world");

      // Unknown file id -> 404.
      const missing = await agent.request()
        .get(`/api/channels/${channelId}/files/0123456789abcdef01234567`)
        .header("Authorization", `Bearer ${token}`)
        .expect(404);
      await missing.body?.cancel?.();

      // Removing the message cascades: file row deleted + blob removed.
      await agent.request()
        .delete(`/api/messages/${msg.id}`)
        .emptyBody()
        .header("Authorization", `Bearer ${token}`)
        .expect(204);

      list = await core.file.getChannel({ userId, channelId });
      assertEquals(list.length, 0);
      assertEquals(await core.storage.exists(storageId), false);

      await repo.file.removeMany({ channelId: EntityId.from(channelId) });
    });
  } finally {
    await agent.close();
  }
});

Deno.test("files - upload with ?attach=channel becomes a channel file with no message", async () => {
  const agent = await Agent.from(app);
  try {
    const session = await login(repo, agent, "admin");
    const token = session.token;
    const admin = await repo.user.get({ email: "admin" });
    const userId = admin!.id.toString();

    await usingChannel(repo, {
      name: "files-test-standalone",
      channelType: ChannelType.PUBLIC,
      users: [EntityId.from(userId)],
    }, async (channelId) => {
      const res = await agent.request()
        .post(`/api/channels/${channelId}/files?attach=channel`)
        .file("deno/storage/tests/quack.png")
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      const body = await res.json();
      assertEquals(body.status, "ok");
      assertEquals(body.file.status, "attached");
      assertEquals(body.file.messageId, null);
      assert(
        !("storageId" in body.file),
        "storageId must not leak in the upload response",
      );

      // It shows up in the channel files view without any message.
      const list = await core.file.getChannel({ userId, channelId });
      assertEquals(list.length, 1);
      assertEquals(list[0].messageId, null);

      await repo.file.removeMany({ channelId: EntityId.from(channelId) });
    });
  } finally {
    await agent.close();
  }
});

Deno.test("files - download: thumbnail, disposition, access control", async () => {
  const agent = await Agent.from(app);
  try {
    const session = await login(repo, agent, "admin");
    const token = session.token;
    const admin = await repo.user.get({ email: "admin" });
    const userId = admin!.id.toString();
    const memberSession = await login(repo, agent, "member");
    const memberToken = memberSession.token;

    await usingChannel(repo, {
      name: "files-test-download",
      channelType: ChannelType.PRIVATE,
      users: [EntityId.from(userId)],
    }, async (channelId) => {
      const img = await Deno.readFile("deno/storage/tests/quack.png");
      const storageId = await core.storage.upload(
        new Blob([img]).stream(),
        { filename: "pic.png", contentType: "image/png", size: img.length },
      );
      const fileId = (await core.dispatch({
        type: "file:register",
        body: {
          channelId,
          userId,
          storageId,
          fileName: "pic.png",
          contentType: "image/png",
          size: img.length,
          resolution: null,
        },
      }).internal() as EntityId).toString();

      // download=true sets Content-Disposition.
      const dl = await agent.request()
        .get(`/api/channels/${channelId}/files/${fileId}?download=true`)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      assertEquals(
        dl.headers.get("content-disposition"),
        'attachment; filename="pic.png"',
      );
      await dl.body?.cancel?.();

      // ?w&h returns a smaller, still-decodable image.
      const thumb = await agent.request()
        .get(`/api/channels/${channelId}/files/${fileId}?w=16&h=16`)
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      assertEquals(thumb.headers.get("content-type"), "image/png");
      const thumbBytes = new Uint8Array(await thumb.arrayBuffer());
      assert(
        thumbBytes.length > 0 && thumbBytes.length < img.length,
        "thumbnail should be smaller than the original",
      );

      // A non-member cannot download the file.
      const denied = await agent.request()
        .get(`/api/channels/${channelId}/files/${fileId}`)
        .header("Authorization", `Bearer ${memberToken}`)
        .expect(403);
      await denied.body?.cancel?.();

      await repo.file.removeMany({ channelId: EntityId.from(channelId) });
    });
  } finally {
    await agent.close();
  }
});

Deno.test("files - message update attaches additional files", async () => {
  const agent = await Agent.from(app);
  try {
    const session = await login(repo, agent, "admin");
    const token = session.token;
    const admin = await repo.user.get({ email: "admin" });
    const userId = admin!.id.toString();

    await usingChannel(repo, {
      name: "files-test-update",
      channelType: ChannelType.PUBLIC,
      users: [EntityId.from(userId)],
    }, async (channelId) => {
      const a = await uploadFile(channelId, userId, "a.txt", "text/plain", "a");
      const b = await uploadFile(channelId, userId, "b.txt", "text/plain", "b");

      const res = await agent.request()
        .post(`/api/channels/${channelId}/messages`)
        .json({ flat: "one", fileIds: [a.fileId] })
        .header("Authorization", `Bearer ${token}`)
        .expect(200);
      const msg = await res.json();
      assertEquals(msg.files.length, 1);

      // Editing the message to reference both files attaches the new one.
      await agent.request()
        .patch(`/api/messages/${msg.id}`)
        .json({ fileIds: [a.fileId, b.fileId] })
        .header("Authorization", `Bearer ${token}`)
        .expect(204);

      const updated = await core.message.get({ userId, messageId: msg.id });
      const names = (updated.files ?? []).map((f) => f.fileName).sort();
      assertEquals(names, ["a.txt", "b.txt"]);

      const list = await core.file.getChannel({ userId, channelId });
      assertEquals(list.length, 2);

      await repo.file.removeMany({ channelId: EntityId.from(channelId) });
    });
  } finally {
    await agent.close();
  }
});

Deno.test("files - direct delete only by uploader, sweeps storage", async () => {
  const agent = await Agent.from(app);
  try {
    const session = await login(repo, agent, "admin");
    const token = session.token;
    const admin = await repo.user.get({ email: "admin" });
    const userId = admin!.id.toString();

    await usingChannel(repo, {
      name: "files-test-delete",
      channelType: ChannelType.PUBLIC,
      users: [EntityId.from(userId)],
    }, async (channelId) => {
      const { storageId, fileId } = await uploadFile(
        channelId,
        userId,
        "doc.txt",
        "text/plain",
        "content",
      );
      await agent.request()
        .post(`/api/channels/${channelId}/messages`)
        .json({ flat: "doc", fileIds: [fileId] })
        .header("Authorization", `Bearer ${token}`)
        .expect(200);

      await agent.request()
        .delete(`/api/channels/${channelId}/files/${fileId}`)
        .json({})
        .header("Authorization", `Bearer ${token}`)
        .expect(204);

      const list = await core.file.getChannel({ userId, channelId });
      assertEquals(list.length, 0);
      assertEquals(await core.storage.exists(storageId), false);

      await repo.file.removeMany({ channelId: EntityId.from(channelId) });
    });
  } finally {
    await agent.close();
  }
});

Deno.test("files - non-member upload with ?attach=channel is denied", async () => {
  const agent = await Agent.from(app);
  try {
    await login(repo, agent, "admin");
    const admin = await repo.user.get({ email: "admin" });
    const userId = admin!.id.toString();
    const memberSession = await login(repo, agent, "member");
    const memberToken = memberSession.token;

    await usingChannel(repo, {
      name: "files-test-attach-denied",
      channelType: ChannelType.PRIVATE,
      users: [EntityId.from(userId)],
    }, async (channelId) => {
      const res = await agent.request()
        .post(`/api/channels/${channelId}/files?attach=channel`)
        .file("deno/storage/tests/quack.png")
        .header("Authorization", `Bearer ${memberToken}`)
        .expect(403);
      await res.body?.cancel?.();
    });
  } finally {
    await agent.close();
  }
});

Deno.test("files - upload with unknown ?attach value is rejected", async () => {
  const agent = await Agent.from(app);
  try {
    const session = await login(repo, agent, "admin");
    const token = session.token;
    const admin = await repo.user.get({ email: "admin" });
    const userId = admin!.id.toString();

    await usingChannel(repo, {
      name: "files-test-attach-bogus",
      channelType: ChannelType.PUBLIC,
      users: [EntityId.from(userId)],
    }, async (channelId) => {
      const res = await agent.request()
        .post(`/api/channels/${channelId}/files?attach=bogus`)
        .file("deno/storage/tests/quack.png")
        .header("Authorization", `Bearer ${token}`)
        .expect(400);
      await res.body?.cancel?.();
    });
  } finally {
    await agent.close();
  }
});

Deno.test({
  name: "files - attachToChannel twice is an idempotent no-op",
  ignore: isRemote,
}, async () => {
  const agent = await Agent.from(app);
  try {
    await login(repo, agent, "admin");
    const admin = await repo.user.get({ email: "admin" });
    const userId = admin!.id.toString();

    await usingChannel(repo, {
      name: "files-test-attach-twice",
      channelType: ChannelType.PUBLIC,
      users: [EntityId.from(userId)],
    }, async (channelId) => {
      const { fileId } = await uploadFile(
        channelId,
        userId,
        "twice.txt",
        "text/plain",
        "twice",
      );

      const events: Record<string, unknown>[] = [];
      const unsubscribe = core.bus.on(userId, (msg) => {
        if (msg.type === "file") events.push(msg);
      });

      try {
        await core.dispatch({
          type: "file:attachToChannel",
          body: { fileId, channelId, userId },
        }).internal();
        await core.dispatch({
          type: "file:attachToChannel",
          body: { fileId, channelId, userId },
        }).internal();
      } finally {
        unsubscribe();
      }

      const file = await repo.file.get({ id: EntityId.from(fileId) });
      assertEquals(file!.status, "attached");
      assertEquals(events.length, 1);

      await repo.file.removeMany({ channelId: EntityId.from(channelId) });
    });
  } finally {
    await agent.close();
  }
});

Deno.test({
  name:
    "files - upload with ?attach=channel emits a client-safe 'file' bus event",
  ignore: isRemote,
}, async () => {
  const agent = await Agent.from(app);
  try {
    const session = await login(repo, agent, "admin");
    const token = session.token;
    const admin = await repo.user.get({ email: "admin" });
    const userId = admin!.id.toString();

    await usingChannel(repo, {
      name: "files-test-attach-event",
      channelType: ChannelType.PUBLIC,
      users: [EntityId.from(userId)],
    }, async (channelId) => {
      const events: Record<string, unknown>[] = [];
      const unsubscribe = core.bus.on(userId, (msg) => {
        if (msg.type === "file") events.push(msg);
      });

      try {
        const res = await agent.request()
          .post(`/api/channels/${channelId}/files?attach=channel`)
          .file("deno/storage/tests/quack.png")
          .header("Authorization", `Bearer ${token}`)
          .expect(200);
        const body = await res.json();

        assertEquals(events.length, 1);
        assertEquals(events[0].id, body.file.id);
        assertEquals(events[0].channelId, channelId);
        assertEquals(events[0].status, "attached");
        assert(
          !("storageId" in events[0]),
          "storageId must not leak in the 'file' bus event",
        );
      } finally {
        unsubscribe();
      }

      await repo.file.removeMany({ channelId: EntityId.from(channelId) });
    });
  } finally {
    await agent.close();
  }
});

Deno.test({
  name: "files - removeStaleDrafts sweeps only old drafts",
  ignore: isRemote,
}, async () => {
  const agent = await Agent.from(app);
  try {
    await login(repo, agent, "admin");
    const admin = await repo.user.get({ email: "admin" });
    const userId = admin!.id.toString();

    await usingChannel(repo, {
      name: "files-test-stale-drafts",
      channelType: ChannelType.PUBLIC,
      users: [EntityId.from(userId)],
    }, async (channelId) => {
      const oldDraft = await uploadFile(
        channelId,
        userId,
        "old-draft.txt",
        "text/plain",
        "old draft",
      );
      const oldAttached = await uploadFile(
        channelId,
        userId,
        "old-attached.txt",
        "text/plain",
        "old attached",
      );
      const freshDraft = await uploadFile(
        channelId,
        userId,
        "fresh-draft.txt",
        "text/plain",
        "fresh draft",
      );

      await core.dispatch({
        type: "file:attachToChannel",
        body: { fileId: oldAttached.fileId, channelId, userId },
      }).internal();

      const backdated = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await repo.file.update(
        { id: EntityId.from(oldDraft.fileId) },
        { createdAt: backdated },
      );
      await repo.file.update(
        { id: EntityId.from(oldAttached.fileId) },
        { createdAt: backdated },
      );

      await core.dispatch({
        type: "file:removeStaleDrafts",
        body: {},
      }).internal();

      assertEquals(
        await repo.file.get({ id: EntityId.from(oldDraft.fileId) }),
        null,
      );
      assertEquals(await core.storage.exists(oldDraft.storageId), false);

      const attached = await repo.file.get({
        id: EntityId.from(oldAttached.fileId),
      });
      assertEquals(attached!.status, "attached");
      assertEquals(await core.storage.exists(oldAttached.storageId), true);

      const fresh = await repo.file.get({
        id: EntityId.from(freshDraft.fileId),
      });
      assertEquals(fresh!.status, "draft");
      assertEquals(await core.storage.exists(freshDraft.storageId), true);

      await repo.file.removeMany({ channelId: EntityId.from(channelId) });
    });
  } finally {
    await agent.close();
  }
});

Deno.test({
  name: "files - bus events on attach/remove carry client-safe payloads",
  ignore: isRemote,
}, async () => {
  const agent = await Agent.from(app);
  try {
    const session = await login(repo, agent, "admin");
    const token = session.token;
    const admin = await repo.user.get({ email: "admin" });
    const userId = admin!.id.toString();

    await usingChannel(repo, {
      name: "files-test-events",
      channelType: ChannelType.PUBLIC,
      users: [EntityId.from(userId)],
    }, async (channelId) => {
      const { fileId } = await uploadFile(
        channelId,
        userId,
        "evt.txt",
        "text/plain",
        "event payload",
      );

      const events: Record<string, unknown>[] = [];
      const unsubscribe = core.bus.on(userId, (msg) => {
        if (msg.type === "file" || msg.type === "file:removed") {
          events.push(msg);
        }
      });

      try {
        await agent.request()
          .post(`/api/channels/${channelId}/messages`)
          .json({ flat: "evt", fileIds: [fileId] })
          .header("Authorization", `Bearer ${token}`)
          .expect(200);

        const attached = events.find((e) => e.type === "file");
        assert(attached, "attach should emit a 'file' bus event");
        assertEquals(attached.id, fileId);
        assertEquals(attached.channelId, channelId);
        assertEquals(attached.fileName, "evt.txt");
        assertEquals(attached.status, "attached");
        assert(
          !("storageId" in attached),
          "storageId must not leak in the 'file' bus event",
        );

        await agent.request()
          .delete(`/api/channels/${channelId}/files/${fileId}`)
          .emptyBody()
          .header("Authorization", `Bearer ${token}`)
          .expect(204);

        const removed = events.find((e) => e.type === "file:removed");
        assert(removed, "remove should emit a 'file:removed' bus event");
        assertEquals(removed.id, fileId);
        assertEquals(removed.channelId, channelId);
      } finally {
        unsubscribe();
      }

      await repo.file.removeMany({ channelId: EntityId.from(channelId) });
    });
  } finally {
    await agent.close();
  }
});
