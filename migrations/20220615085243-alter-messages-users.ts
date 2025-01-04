import { Db } from "mongodb";

export async function up(db: Db) {
    const docs = db.collection('messages').find({ $or: [{ userId: { $exists: false } }, { userId: undefined }] });
    for await (const doc of docs) {
        await db.collection('messages').updateOne({ _id: doc._id }, { $set: { userId: doc.user?.id } });
    }
}
export async function down() {
    // empty
}
