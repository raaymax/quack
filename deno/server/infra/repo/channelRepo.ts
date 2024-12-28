import { serialize } from "./serializer.ts";
import { Channel, EntityId } from "../../types.ts";
import { Repo } from "./repo.ts";

type ChannelQuery = Partial<Channel & { userId: EntityId; usersCount: number }>;
export class ChannelRepo extends Repo<ChannelQuery, Channel> {
  override COLLECTION = "channels";

  override makeQuery(data: ChannelQuery) {
    const { userId, users, usersCount, ...rest } = serialize(data);
    const query = { ...rest };
    const userQuery: any = {};
    if (userId) userQuery["$elemMatch"] = { $eq: userId };
    if (users) userQuery["$all"] = users;
    if (usersCount) userQuery["$size"] = usersCount;
    if (userId || users || usersCount) query.users = userQuery;
    return query;
  }

  async join(query: ChannelQuery, userId: EntityId) {
    const { db } = await this.connect();
    return db.collection(this.COLLECTION)
      .updateOne(
        this.makeQuery(query),
        { $push: { users: serialize(userId) } },
      );
  }
}
