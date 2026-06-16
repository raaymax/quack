import { Database } from "./db.ts";
import { deserialize, serialize } from "./serializer.ts";
import { EntityId, Session } from "../../types.ts";

export class SessionRepo {
  constructor(private db: Database) {}

  get connect() {
    return this.db.connect;
  }

  #generateToken() {
    return Array.from(
      crypto.getRandomValues(new Uint8Array(32)),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
  }

  async create(data: { userId: EntityId; expires: Date }): Promise<EntityId> {
    const { db } = await this.connect();
    const newSession = serialize({
      userId: data.userId,
      token: this.#generateToken(),
      expires: data.expires,
    });
    const ret = await db.collection("sessions").insertOne(newSession);
    return deserialize(ret.insertedId);
  }

  async refresh(id: EntityId, expires: Date): Promise<void> {
    const { db } = await this.connect();
    await db.collection("sessions").updateOne(
      serialize({ id }),
      { $set: { expires } },
    );
  }

  async remove(data: { id?: EntityId }): Promise<void> {
    const { db } = await this.connect();
    const { id } = data;
    if (!id) return;
    await db.collection("sessions").deleteOne(serialize(data));
  }

  async get(data: Partial<Session>): Promise<Session | null> {
    if (!data) return null;
    const { db } = await this.connect();
    const session = await db.collection("sessions").findOne(serialize(data));
    return deserialize(session);
  }
}
