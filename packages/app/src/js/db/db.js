import Dexie from 'dexie';

export const db = new Dexie('myDatabase');

window.db = db;

db.version(1).stores({
  global: 'key',
  messages: 'clientId, id, createdAt, [channelId+parentId+streamIdx]',
  messagesIndex: '[channelId+parentId+page], refreshedAt',
  users: 'id, name, avatarUrl',
  channels: 'id, name, signed',
  emojis: 'shortname',
});