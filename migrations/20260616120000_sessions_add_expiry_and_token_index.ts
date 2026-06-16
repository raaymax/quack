import { Db, ObjectId } from "mongodb";

const SESSION_TTL_MS = 60 * 60 * 24 * 60 * 1000;

export const up = async (db: Db) => {
  await db.collection("sessions").updateMany(
    { expires: { $exists: false } },
    [{ $set: { expires: { $add: ["$$NOW", SESSION_TTL_MS] } } }],
  );

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

  await db.collection("sessions").createIndex(
    { expires: 1 },
    { expireAfterSeconds: 0 },
  );
  await db.collection("sessions").createIndex({ token: 1 }, { unique: true });
};

export const down = async (db: Db) => {
  await db.collection("sessions").dropIndex("expires_1");
  await db.collection("sessions").dropIndex("token_1");
};
