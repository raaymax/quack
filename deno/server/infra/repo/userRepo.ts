import { serialize } from "./serializer.ts";
import { EntityId, User } from "../../types.ts";
import { Repo } from "./repo.ts";

type DbUser = User & { mainChannelId: EntityId };

type Secret = {
  hash: string,
  data: {
    encrypted: string,
    _iv: string,
  },
  createdAt: Date,
}

type UserQuery = Partial<DbUser & { userId: EntityId }>;
export class UserRepo extends Repo<UserQuery, DbUser> {
  COLLECTION = "users";

  makeQuery(data: UserQuery) {
    const { userId, ...rest } = serialize(data);
    return {
      ...rest,
      ...(userId ? { users: { $elemMatch: { $eq: userId } } } : {}),
    };
  }

  async addChannelEncryptionKey(
    userId: EntityId,
    channelId: EntityId,
    encryptionKey: string,
  ) {
    const { db } = await this.connect();
    return db.collection(this.COLLECTION)
      .updateOne(
        { _id: userId },
        { $push: { channels: serialize({ channelId, encryptionKey }) } },
      );
  }

  async updatePassword(query: UserQuery, data: Secret) {
    const { db } = await this.connect();
    return db.collection(this.COLLECTION)
      .updateOne(
        this.makeQuery(query),
        { $set: { 'secrets.password': data } },
      );
  }

  async updateBackup(query: UserQuery, data: Secret) {
    const { db } = await this.connect();
    return db.collection(this.COLLECTION)
      .updateOne(
        this.makeQuery(query),
        { $set: { 'secrets.backup': data } },
      );
  }

  async upgrade(query: UserQuery, data: { publicKey: any, secrets: Secret }) {
    const { db } = await this.connect();
    await db.collection(this.COLLECTION)
      .updateOne(
        this.makeQuery(query),
        { $set: { publicKey: data.publicKey } },
      );
    await db.collection(this.COLLECTION)
      .updateOne(
        this.makeQuery(query),
        { $unset: { password: 1, resetToken: 1 } },
      );

    await this.updatePassword(query, data.secrets);
  }
}
