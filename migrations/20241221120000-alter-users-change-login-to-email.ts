export const up = async (db) => {
  await db.collection('users').dropIndex({login: 1})
	const docs = await db.collection('users').find({});
	for await (const doc of docs) {
		await db.collection('users').updateOne({ _id: doc._id }, { $set: {
      email: doc.login,
    }});
		await db.collection('users').updateOne({ _id: doc._id }, { $unset: {
      login: 1
    }});
	}
  await db.collection('users').createIndex({ email: 1 }, { unique: true});
  await db.collection('sessions').removeMany({});
};

export const down = async (db) => {
  await db.collection('users').dropIndex({email: 1})
	const docs = await db.collection('users').find({});
	for await (const doc of docs) {
		await db.collection('users').updateOne({ _id: doc._id }, { $set: {
      login: doc.email,
    }});

		await db.collection('users').updateOne({ _id: doc._id }, { $unset: {
      email: 1,
    } });
	}
  await db.collection('users').createIndex({ login: 1 }, { unique: true });
  await db.collection('sessions').removeMany({});
}
