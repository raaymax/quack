import { Db } from "mongodb";

const MAX_SIZE_BYTES = 512 * 1024 * 1024;

export const up = async (db: Db) => {
  const [existing] = await db.listCollections({ name: "anonymousRequests" })
    .toArray();
  if (!existing) {
    await db.createCollection("anonymousRequests", {
      capped: true,
      size: MAX_SIZE_BYTES,
    });
  } else if (
    !(existing as { options?: { capped?: boolean } }).options?.capped
  ) {
    await db.command({
      convertToCapped: "anonymousRequests",
      size: MAX_SIZE_BYTES,
    });
  }
  const requests = db.collection("anonymousRequests");
  await requests.createIndex({ createdAt: -1 });
  await requests.createIndex({ ip: 1, createdAt: -1 });
  await requests.createIndex({ status: 1, createdAt: -1 });
};

export const down = async (db: Db) => {
  await db.collection("anonymousRequests").drop();
};
