import { Db, ObjectId } from "mongodb";

export const up = async (db: Db) => {
  const badges = db.collection('badges').find({});
  const duplicates: ObjectId[] = [];
  const seen: Record<string, boolean> = {};
  for await (const badge of badges) {
    const key = `${badge.userId}-${badge.channelId}-${badge.parentId}`;
    if (seen[key]) {
      duplicates.push(badge._id);
    }
    seen[key] = true;
  }
  await db.collection('badges').deleteMany({ _id: { $in: duplicates } });
  await db.collection('badges').createIndex({ userId: 1, channelId: 1, parentId: 1 }, { unique: true });

};

export const down = async (db: Db) => {
  await db.collection('badges').dropIndex("userId_1_channelId_1_parentId_1");
}
