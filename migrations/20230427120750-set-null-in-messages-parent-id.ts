 
export async function up(db) {
    const cursor = await db.collection('messages')
        .find({ parentId: { $exists: false } });
    while (await cursor.hasNext()) {
        const message = await cursor.next();
        await db.collection('messages')
            .updateOne({ _id: message._id }, {
                $set: { parentId: null },
            });
    }
}
export async function down() {
    // Nothing
}
