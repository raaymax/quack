import { Db } from "mongodb";

export async function up(db: Db) {
    db.collection('users').insertMany([
        {
            login: 'system',
            name: 'System',
            avatarUrl: '/icon.png',
            hidden: true,
        },
    ]);
}
export async function down(db: Db) {
    await db.collection('users').deleteOne({ login: 'system' });
}
