import { Db } from "mongodb";

export async function up(db: Db) {
    const cursor = db.collection('messages').aggregate([{ $group: { _id: '$clientId', count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]);
    for await (const fixItem of cursor) {
        await db.collection('messages').updateOne(
            { clientId: { $eq: fixItem._id } },
            [{
                $set: {
                    clientId: `temp:${Math.random() + 1}`,
                },
            }]
        );
    }
    return db.collection('messages').createIndex({ clientId: 1 }, { unique: true });
}
export async function down(db: Db) {
    return db.collection('messages').createIndex({ clientId: 1 }, { unique: true });
}
