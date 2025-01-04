import { Db, ObjectId } from 'mongodb';
import { hash } from "@felix/argon2";
import * as enc from '@quack/encryption';

export async function up(db: Db) {
  if (await db.collection('users').countDocuments() === 0) {
    const data = await enc.prepareRegistration({ email: 'admin', password: "123" });
    await db.collection('users').insertMany([
      {
        _id: new ObjectId('6255a4156c28443c92c26d7e'),
        clientId: '7ed5c52c-35f8-4a27-929d-ff5eb1a74924',
        avatarUrl: '/avatar.png',
        name: 'Admin',
        login: data.email,
        publicKey: data.publicKey,
        secrets: {
          password: {
            hash: await hash(data.password),
            data: data.secrets,
            createdAt: new Date(),
          }
        }
      },
    ]);
  }
}

export async function down(db: Db) {
  return db.collection('users').deleteMany({});
}
