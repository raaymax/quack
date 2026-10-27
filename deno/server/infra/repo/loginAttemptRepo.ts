import { Database } from "./db.ts";

export class LoginAttemptRepo {
  COLLECTION = "loginAttempts";

  constructor(private db: Database) {}

  get connect() {
    return this.db.connect;
  }

  async recordFailure(ip: string): Promise<void> {
    const { db } = await this.connect();
    await db.collection(this.COLLECTION).insertOne({
      ip,
      createdAt: new Date(),
    });
  }

  async recentFailureTimes(
    ip: string,
    since: Date,
    limit: number,
  ): Promise<Date[]> {
    const { db } = await this.connect();
    const docs = await db.collection(this.COLLECTION)
      .find({ ip, createdAt: { $gte: since } }, {
        projection: { createdAt: 1 },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map((doc) => doc.createdAt);
  }
}
