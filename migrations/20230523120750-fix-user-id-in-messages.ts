import { ObjectId } from 'mongodb';
 
export async function up(db) {
  const cursor = await db.collection('messages')
    .find({});
  while (await cursor.hasNext()) {
    const message = await cursor.next();
    if (message.userId instanceof ObjectId) {
      await db.collection('messages')
        .updateOne({ _id: message._id }, {
          $set: { userId: new ObjectId(message.userId) },
        });
    }
  }
}

export async function down() {
  // Nothing
}
