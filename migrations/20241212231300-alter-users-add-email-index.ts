import { Db } from "mongodb";

export async function up(db: Db) {
    return db.collection('users').createIndex({ login: 1 }, { unique: true });
}
export async function down(db: Db) {
    return db.collection('users').createIndex({ login: 1 }, { unique: false });
}
