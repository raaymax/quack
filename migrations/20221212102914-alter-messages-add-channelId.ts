import { Db, ObjectId } from "mongodb";

export async function up(db: Db) {
    const channels = await db.collection('channels').find({}).toArray();

    const channelsByCid = channels.reduce<Record<string,ObjectId>>((acc, channel) => {
        acc[channel.cid] = channel._id;
        return acc;
    }, {});

    const cursor = db.collection('messages')
        .find({ channelId: { $exists: false } });

    for await (const message of cursor) {
        await db.collection('messages')
            .updateOne({ _id: message._id }, {
                $set: { channelId: channelsByCid[message.channel] },
            });
    }
}
export async function down(db: Db) {
    return db.collection('messages').updateMany({}, { $unset: { channelId: true } });
}
