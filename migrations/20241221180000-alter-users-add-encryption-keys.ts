export const up = async (db) => {
	const docs = await db.collection('messages').find({});
	for await (const doc of docs) {
    if(doc.message.encrypted){
      console.log('.')
      await db.collection('messages').updateOne({ _id: doc._id }, { $set: {
        encrypted: true,
      } });
    }
	}
};

export const down = async (db) => {
}
