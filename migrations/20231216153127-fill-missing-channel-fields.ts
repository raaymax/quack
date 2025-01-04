import { Db } from "mongodb";

export async function up(db: Db) {
    const cursor = db.collection('channels').find({});
    for await (const channel of cursor) {
        await db.collection('channels')
            .updateOne({ _id: channel._id }, {
                $set: {
                    private: Boolean(channel.private),
                    direct: Boolean(channel.direct),
                },
            });
    }
}
export async function down() {
    // Nothing
}
