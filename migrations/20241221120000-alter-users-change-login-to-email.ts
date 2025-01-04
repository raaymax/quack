import { Db } from "mongodb";

export const up = async (db: Db) => {
  await db.collection('users').dropIndex("login_1");
	const docs = db.collection('users').find({});
	for await (const doc of docs) {
		await db.collection('users').updateOne({ _id: doc._id }, { $set: {
      email: doc.login,
    }});
		await db.collection('users').updateOne({ _id: doc._id }, { $unset: {
      login: 1
    }});
	}
  await db.collection('users').createIndex({ email: 1 }, { unique: true});
  await db.collection('sessions').deleteMany({});
};

export const down = async (db: Db) => {
  await db.collection('users').dropIndex("email_1");
	const docs = db.collection('users').find({});
	for await (const doc of docs) {
		await db.collection('users').updateOne({ _id: doc._id }, { $set: {
      login: doc.email,
    }});

		await db.collection('users').updateOne({ _id: doc._id }, { $unset: {
      email: 1,
    } });
	}
  await db.collection('users').createIndex({ login: 1 }, { unique: true });
  await db.collection('sessions').deleteMany({});
}
