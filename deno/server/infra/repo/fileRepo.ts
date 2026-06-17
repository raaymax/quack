import { EntityId, FileEntry } from "../../types.ts";
import { Repo } from "./repo.ts";
import { deserialize, serialize } from "./serializer.ts";

type FileQuery = Partial<FileEntry>;
export class FileRepo extends Repo<FileQuery, FileEntry> {
  override COLLECTION = "files";

  async getManyByIds(ids: EntityId[]): Promise<FileEntry[]> {
    if (!ids.length) return [];
    const { db } = await this.connect();
    const items = await db.collection(this.COLLECTION)
      .find({ _id: { $in: ids.map((id) => serialize(EntityId.from(id))) } })
      .toArray();
    return deserialize(items);
  }

  async getChannelFiles(channelId: EntityId): Promise<FileEntry[]> {
    const { db } = await this.connect();
    const items = await db.collection(this.COLLECTION)
      .find(this.makeQuery({ channelId, status: "attached" }))
      .sort("createdAt", -1)
      .toArray();
    return deserialize(items);
  }
}
