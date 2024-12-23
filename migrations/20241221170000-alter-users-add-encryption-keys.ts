import { encodeBase64 } from "@std/encoding/base64";
import {generateChannelKey} from '../deno/server/core/encryption.ts';

async function encrypt(plaintext, key) {
    const iv = crypto.getRandomValues(new Uint8Array(16)); // Random 16-byte IV
    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv },
        key,
        encoder.encode(plaintext)
    );
		return {encrypted: encodeBase64(ciphertext), _iv: encodeBase64(iv)};
}

async function importKey(rawKey) {
    return crypto.subtle.importKey(
        "jwk", // Format
        rawKey, // Key as ArrayBuffer
        { name: "AES-CBC" }, // Algorithm
        false, // Non-extractable
        ["encrypt", "decrypt"] // Usages
    );
}

export const up = async (db) => {
	const docs = await db.collection('users').find({});
	for await (const doc of docs) {
    const userJWK = await generateChannelKey();
		await db.collection('users').updateOne({ _id: doc._id }, { $set: {
      salt: encodeBase64(crypto.getRandomValues(new Uint8Array(16))),
      encryptionKey: userJWK,
      channels: [],
    } });
    const userKey = await importKey(userJWK);
    const channels = await db.collection('channels').find({users: { $elemMatch: {$eq: doc._id} }});
    for await (const channel of channels) {
      const encryptedChannelKey = await encrypt(JSON.stringify(channel.encryptionKey), userKey);
      await db.collection('users').updateOne({ _id: doc._id }, { $push: {
        channels: {
          channelId: channel._id,
          encryptionKey: encryptedChannelKey,
        }
      } });
    }
	}
};

export const down = async (db) => {
	const docs = await db.collection('users').find({});
	for await (const doc of docs) {
		await db.collection('users').updateOne({ _id: doc._id }, { $unset: {
      encryptionKey: 1,
      channels: 1,
    } });
	}
}
