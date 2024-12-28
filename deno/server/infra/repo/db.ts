import { Db, MongoClient, ReadConcern, ReadPreference, W } from "mongodb";

export { ObjectId } from "mongodb";

export class Database {
  db: Db | undefined = undefined;

  client: MongoClient | undefined = undefined;

  databaseUrl: string;

  promises: Promise<any>[] = [];

  connected = false;

  constructor(url: string) {
    this.databaseUrl = url;
  }

  init = (url: string) => {
    this.databaseUrl = url;
    this.client = new MongoClient(this.databaseUrl);
    return this.client;
  };

  connect = async () => {
    if (!this.databaseUrl) throw new Error("Database not initialized");
    if (this.db && this.client) return { db: this.db, client: this.client };
    try {
      this.client = new MongoClient(this.databaseUrl);
      await this.client.connect();
      this.connected = true;
      this.db = this.client.db();
      return { db: this.db, client: this.client };
    } catch (e) {
      console.error("db connect", e);
      throw e;
    }
  };

  disconnect = async () => {
    if (this.client) {
      await Promise.all(this.promises);
      if (this.connected) {
        await this.client.close();
        this.connected = false;
      }
      this.db = undefined;
      this.client = undefined;
    }
  };

  withTransaction = async <T>(fn: () => Promise<T>): Promise<T> => {
    const { promise, resolve, reject } = Promise.withResolvers<T>();
    promise.catch(() => {}).then(() => {
      const index = this.promises.indexOf(promise);
      if (index !== -1) this.promises.splice(index, 1);
    });
    const { client } = await this.connect();
    this.promises.push(promise);
    const session = client.startSession();
    const transactionOptions = {
      readPreference: ReadPreference.PRIMARY,
      readConcern: ReadConcern.SNAPSHOT,
      writeConcern: { w: "majority" as W },
    };

    try {
      await session.withTransaction(
        async () => resolve(await fn()),
        transactionOptions,
      );
      return promise;
    } catch (error) {
      reject(error);
      return promise;
    } finally {
      session.endSession();
    }
  };
}
