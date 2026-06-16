import { Db, ObjectId } from "mongodb";

// Keep in sync with deno/server/core/session/constants.ts (SESSION_TTL_SECONDS).
const SESSION_TTL_MS = 60 * 60 * 24 * 60 * 1000; // 60 days

export const up = async (db: Db) => {
  // Backfill `expires` for sessions created before expiry existed so the TTL
  // index can manage them (TTL ignores documents missing the field).
  await db.collection("sessions").updateMany(
    { expires: { $exists: false } },
    [{ $set: { expires: { $add: ["$$NOW", SESSION_TTL_MS] } } }],
  );

  // Drop any duplicate tokens before enforcing uniqueness (legacy tokens were
  // generated with Math.random()).
  const duplicates: ObjectId[] = [];
  const seen = new Set<string>();
  const cursor = db.collection("sessions").find({});
  for await (const session of cursor) {
    if (typeof session.token !== "string") continue;
    if (seen.has(session.token)) {
      duplicates.push(session._id);
    } else {
      seen.add(session.token);
    }
  }
  if (duplicates.length) {
    await db.collection("sessions").deleteMany({ _id: { $in: duplicates } });
  }

  // TTL index: MongoDB removes a session once `expires` passes.
  await db.collection("sessions").createIndex(
    { expires: 1 },
    { expireAfterSeconds: 0 },
  );
  // Tokens must be unique.
  await db.collection("sessions").createIndex({ token: 1 }, { unique: true });
};

export const down = async (db: Db) => {
  await db.collection("sessions").dropIndex("expires_1");
  await db.collection("sessions").dropIndex("token_1");
};
