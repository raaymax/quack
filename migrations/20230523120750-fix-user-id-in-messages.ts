import { Db, ObjectId } from 'mongodb';
 
export async function up(db: Db) {
  const cursor = db.collection('messages').find({});
  for await (const message of cursor) {
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
