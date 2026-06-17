import { Db } from "mongodb";

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
