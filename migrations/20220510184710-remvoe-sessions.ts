import { Db } from "mongodb";

export async function up(db: Db) {
    return db.collection('sessions').deleteMany({});
}
export async function down() {
    // empty
}
