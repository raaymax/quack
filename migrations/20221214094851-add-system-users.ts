export async function up(db) {
    db.collection('users').insertMany([
        {
            login: 'system',
            name: 'System',
            avatarUrl: '/icon.png',
            hidden: true,
        },
    ]);
}
export async function down(db) {
    await db.collection('users').deleteOne({ login: 'system' });
}
