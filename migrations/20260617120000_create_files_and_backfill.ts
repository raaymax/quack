import { Db } from "mongodb";

// Introduces the `files` collection (files as a channel-scoped root entity) and
// additively backfills File rows from legacy embedded message attachments.
//
// Backfill is plaintext-only: DIRECT channels store attachment metadata inside
// the encrypted message body and cannot be read server-side, so they are
// skipped (forward-only). Embedded `attachments` are NEVER removed — old
// messages keep rendering via the legacy path; backfilled rows only power the
// per-channel Files view. Backfilled messages are intentionally left WITHOUT
// `fileIds` so they don't double-render (legacy attachments + resolved files).
export const up = async (db: Db) => {
  await db.collection("files").createIndex(
    { messageId: 1, storageId: 1 },
    { unique: true },
  );
  await db.collection("files").createIndex({
    channelId: 1,
    status: 1,
    createdAt: -1,
  });
  await db.collection("files").createIndex({ storageId: 1, status: 1 });

  const directChannels = await db.collection("channels")
    .find({ channelType: "DIRECT" }, { projection: { _id: 1 } })
    .toArray();
  const directIds = new Set(directChannels.map((c) => c._id.toString()));

  const cursor = db.collection("messages")
    .find({ attachments: { $exists: true, $ne: [] } });

  for await (const msg of cursor) {
    if (!Array.isArray(msg.attachments) || !msg.attachments.length) continue;
    if (msg.channelId && directIds.has(msg.channelId.toString())) continue;

    for (const att of msg.attachments) {
      if (!att?.id) continue;
      await db.collection("files").updateOne(
        { messageId: msg._id, storageId: att.id },
        {
          $setOnInsert: {
            storageId: att.id,
            channelId: msg.channelId,
            uploaderId: msg.userId,
            fileName: att.fileName ?? att.id,
            contentType: att.contentType ?? "application/octet-stream",
            size: null,
            resolution: null,
            status: "attached",
            messageId: msg._id,
            createdAt: msg.createdAt ?? new Date(),
          },
        },
        { upsert: true },
      );
    }
  }
};

export const down = async (db: Db) => {
  await db.collection("files").drop();
};
