import { Db } from "mongodb";

export const up = async (db: Db) => {
  const files = db.collection("files");
  if (await files.indexExists("messageId_1_storageId_1")) {
    await files.dropIndex("messageId_1_storageId_1");
  }
  await files.updateMany(
    { messageId: { $exists: true } },
    { $unset: { messageId: "" } },
  );
};

export const down = async (db: Db) => {
  await db.collection("files").createIndex({ messageId: 1, storageId: 1 });
};
