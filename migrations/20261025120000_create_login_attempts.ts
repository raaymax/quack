import { Db } from "mongodb";

const RETENTION_SECONDS = 60 * 60 * 24 * 90;

export const up = async (db: Db) => {
  const attempts = db.collection("loginAttempts");
  await attempts.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: RETENTION_SECONDS },
  );
  await attempts.createIndex({ ip: 1, outcome: 1, createdAt: -1 });
  await attempts.createIndex({ email: 1, outcome: 1, createdAt: -1 });
};

export const down = async (db: Db) => {
  await db.collection("loginAttempts").drop();
};
