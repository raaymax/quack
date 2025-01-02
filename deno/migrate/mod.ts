import * as path from "jsr:@std/path";
import { Db, MongoClient, ReadConcern, ReadPreference, W } from "mongodb";

export { ObjectId } from "mongodb";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const DATABASE_URL = Deno.env.get("DATABASE_URL") ??
  "mongodb://chat:chat@localhost:27017/chat?authSource=admin";

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

export class Repository {
  db: Database;

  constructor(config) {
    const databaseUrl = config.databaseUrl ?? Deno.env.get("DATABASE_URL") ??
      "mongodb://chat:chat@localhost:27017/chat?authSource=admin";
    const db = new Database(databaseUrl);
    this.db = db;
  }

  async getMigrations() {
    const { db } = await this.db.connect();
    return db.collection("migrations").find().sort({ createdAt: 1 }).toArray();
  }

  async push(fileName) {
    const { db } = await this.db.connect();
    await db.collection("migrations").insertOne({
      fileName,
      createdAt: new Date(),
    });
  }

  async pop() {
    const { db } = await this.db.connect();
    const migration = await db.collection("migrations").findOne({}, {
      sort: { createdAt: -1 },
    });
    if (!migration) return;
    await db.collection("migrations").deleteOne({ _id: migration._id });
    return migration.fileName;
  }

  async close() {
    await this.db.disconnect();
  }
}

const repo = new Repository({ databaseUrl: DATABASE_URL });

export class Migrations {
  async up() {
    const { db } = await repo.db.connect();
    const migrations = await repo.getMigrations();
    const files: string[] = [];
    for await (
      const file of Deno.readDir(path.join(__dirname, "../../migrations"))
    ) {
      if (file.isFile) {
        if (migrations.find((m) => m.fileName === file.name)) continue;
        console.log("up", file.name);
        files.push(file.name);
      }
    }
    files.sort();
    for (const file of files) {
      const migration = await import(
        path.join(__dirname, "../../migrations", file)
      );
      await repo.db.withTransaction(async () => {
        await migration.up(db);
      });
      await repo.push(file);
    }
  }

  async down() {
    const { db } = await repo.db.connect();
    const migrations = await repo.getMigrations();
    const last = migrations[migrations.length - 1];
    console.log("down", last.fileName);
    if (!last) return;
    const migration = await import(
      path.join(__dirname, "../../migrations", last.fileName)
    );
    await repo.db.withTransaction(async () => {
      await migration.down(db);
    });
    await repo.pop();
  }

  async list() {
    const { db } = await repo.db.connect();
    const migrations = await repo.getMigrations();
    migrations.forEach((m) => console.log(m.fileName));
  }
}

const migrations = new Migrations();
switch (Deno.args[0]) {
  case "up":
    console.log(await migrations.up());
    break;
  case "down":
    console.log(await migrations.down());
    break;
  case "list":
  default:
    console.log(await migrations.list());
    break;
}

await repo.close();
