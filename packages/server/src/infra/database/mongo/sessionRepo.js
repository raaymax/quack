const { db } = require('./db');
const { serialize, serializeInsert, deserialize } = require('./serializer');

const TABLE_NAME = 'httpSessions';

module.exports = {
  get: async (sess) => (await db).collection(TABLE_NAME)
    .findOne(deserialize(sess))
    .then(serialize),
  getByToken: async (token) => (await db).collection(TABLE_NAME)
    .findOne({ 'session.token': token })
    .then(serialize),
  getAll: async (session) => (await db).collection(TABLE_NAME)
    .find(deserialize(session)).toArray()
    .then(serialize),
  insert: async (data) => (await db).collection(TABLE_NAME)
    .insertOne(deserialize(data))
    .then(serializeInsert),
  update: async (id, session) => (await db).collection(TABLE_NAME)
    .updateOne(deserialize({ id }), { $set: deserialize(session) }),
  delete: async (session) => (await db).collection(TABLE_NAME)
    .deleteOne(deserialize(session)),
  getOther: async ({ userId }) => (await db).collection(TABLE_NAME)
    .find({ 'session.userId': { $ne: userId } }).toArray()
    .then(serialize),
  getByUsers: async ({ userId }) => (await db).collection(TABLE_NAME)
    .find({ 'session.userId': { $in: [userId].flat() } }).toArray()
    .then(serialize),
};
