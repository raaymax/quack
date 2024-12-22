import {generateChannelKey} from '../deno/server/core/encryption.ts';

export const up = async (db) => {
	const docs = await db.collection('channels').find({});
	for await (const doc of docs) {
		await db.collection('channels').updateOne({ _id: doc._id }, { $set: {
      encryptionKey: await generateChannelKey(), 
    } });
	}
};

export const down = async (db) => {
	const docs = await db.collection('channels').find({});
	for await (const doc of docs) {
		await db.collection('channels').updateOne({ _id: doc._id }, { $unset: {
      encryptionKey: 1
    } });
	}
}
