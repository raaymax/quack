import { Db } from "mongodb";

export async function up(db: Db) {
    const cursor = db.collection('messages')
        .find({ parentId: { $exists: false } });
    for await (const message of cursor) {
        await db.collection('messages')
            .updateOne({ _id: message._id }, {
                $set: { parentId: null },
            });
    }
}
export async function down() {
    // Nothing
}
