import { MongoClient, Db } from 'mongodb';

let db: Db;
let client: MongoClient;
let databaseUrl: string;

export const init = (url:string) => {
  databaseUrl = url;
  client = new MongoClient(databaseUrl);
  return client;
}

export const connect = async () => {
  if(!databaseUrl) throw new Error('Database not initialized');
  if(db && client) return { db, client };
  await client.connect();
  db = await client.db();
  return { db, client };
};

