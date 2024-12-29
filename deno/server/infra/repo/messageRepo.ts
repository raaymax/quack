import { ObjectId } from "./db.ts";
import { deserialize, serialize } from "./serializer.ts";
import { EncryptedMessage, EntityId, Message } from "../../types.ts";
import { Repo } from "./repo.ts";

export type Pagination = {
  limit?: number;
  offset?: number;
  order?: 1 | -1;
};

type MessageQuery = Partial<
  Message & {
    search: string;
    before: Date;
    after: Date;
  }
>;

export class MessageRepo extends Repo<MessageQuery, Message> {
  override COLLECTION = "messages";

  override makeQuery(data: MessageQuery) {
    const {
      search,
      before,
      after,
      parentId,
      ...rest
    } = serialize(data);
    return Object.fromEntries(
      Object.entries({
        ...rest,
        ...(search ? { $text: { $search: search } } : {}),
        ...(before ? { createdAt: { $lte: before } } : {}),
        ...(after ? { createdAt: { $gte: after } } : {}),
        ...(parentId === null
          ? { parentId: { $not: { $ne: null } } }
          : { parentId }),
      }).filter(([, v]) => v !== undefined),
    );
  }

  override async getAll(
    arg: MessageQuery,
    { limit = 50, offset = 0, order = 1 }: Pagination = {},
  ) {
    const { db } = await this.connect();
    const query = this.makeQuery(arg);

    const raw = await db
      .collection(this.COLLECTION)
      .find(query)
      .sort("createdAt", order)
      .skip(offset)
      .limit(limit)
      .toArray();

    return deserialize(raw);
  }

  async updateThread(
    arg: { parentId: EntityId; userId: EntityId; id: EntityId },
  ) {
    const { db } = await this.connect();
    const data = serialize(arg);
    return db
      .collection<{ thread: { userId: ObjectId; childId: ObjectId }[] }>(
        this.COLLECTION,
      )
      .updateOne({
        _id: data.parentId,
      }, {
        $push: {
          thread: {
            userId: data.userId,
            childId: data.id,
          },
        },
        $set: {
          updatedAt: new Date(),
        },
      });
  }
}
