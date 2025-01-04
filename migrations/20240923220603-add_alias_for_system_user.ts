import { Db } from "mongodb";

export async function up(db: Db) {
    await db.collection('users').updateOne({ login: 'system' }, { $set: { alias: 'system' } });
}
export async function down(db: Db) {
    await db.collection('users').updateOne({ login: 'system' }, { $unset: { alias: true } });
}
