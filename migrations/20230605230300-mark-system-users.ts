import { Db } from "mongodb";

export async function up(db: Db) {
    db.collection('users').updateMany({ login: { $in: ['system'] } }, { $set: { system: true } });
}
export async function down(db: Db) {
    db.collection('users').updateMany({ login: { $in: ['system'] } }, { $unset: { system: true } });
}
