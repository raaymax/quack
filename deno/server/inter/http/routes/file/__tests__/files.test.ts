import { Agent } from "@planigale/testing";
import { assertEquals } from "@std/assert";
import { login, usingChannel } from "../../__tests__/mod.ts";
import { ChannelType, EntityId } from "../../../../../types.ts";
import { createApp } from "../../__tests__/app.ts";

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
        .emptyBody()
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
