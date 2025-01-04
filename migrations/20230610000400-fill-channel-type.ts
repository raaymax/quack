import { Db } from "mongodb";

const getChannelType = (channel: any) => {
  if (channel.direct) return 'DIRECT';
  if (channel.private) return 'PRIVATE';
  return 'PUBLIC';
};

export async function up(db: Db) {
    const cursor = db.collection('channels').find({});
    for await (const channel of cursor) {
        await db.collection('channels')
            .updateOne({ _id: channel._id }, {
                $set: { channelType: getChannelType(channel) },
            });
    }
}
export async function down() {
    // Nothing
}
