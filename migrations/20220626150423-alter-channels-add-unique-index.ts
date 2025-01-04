import { Db } from "mongodb";

 
export async function up(db: Db) {
  const cursor = db.collection('channels').aggregate([{ $group: { _id: '$cid', count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]);
  for await (const fixItem of cursor) {
    await db.collection('channels').deleteMany({ cid: fixItem._id });
  }
  return db.collection('channels').createIndex({ cid: 1 }, { unique: true });
}

export async function down(db: Db) {
  return db.collection('channels').createIndex({ cid: 1 }, { unique: false });
}
