import { Db } from "mongodb";

 
export async function up(db: Db) {
    return db.collection('messages').createIndex({ flat: 'text' });
}
export async function down(db: Db) {
    return db.collection('messages').createIndex({ flat: 'text' });
}
