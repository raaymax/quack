/* eslint-disable no-undef */
import { Capacitor } from '@capacitor/core';

import { createEventListener } from '../utils';
import { createPool } from './pool';

const { notify, watch } = createEventListener();

let protocol = 'ws:';
if (document.location.protocol === 'https:') {
  protocol = 'wss:';
}

// eslint-disable-next-line no-nested-ternary
const URI = Capacitor.isNativePlatform()
  ? SERVER_URL
  : `${protocol}//${document.location.host}/ws`;

// eslint-disable-next-line no-console
console.log("Connectiong to ", URI);
const pool = createPool(URI);

window.pool = pool;

const client = {
  isOpen: false,
  send: async (msg) => {
    // eslint-disable-next-line no-console
    // console.log('send', JSON.stringify(msg, null, 4));
    const raw = JSON.stringify(msg);
    await pool.send(raw);
  },
  on: (ev, cb) => {
    watch(ev, cb);
    return client;
  },
  // eslint-disable-next-line no-console
  emit: async (name, ...data) => console.log(name, data) || notify(name, client, ...data),
};

pool.onOpen(() => {
  client.isOpen = true;
  return notify('con:open', client)
});
pool.onClose(() => {
  client.isOpen = false;
  return notify('con:close', client)
});
pool.onError(() => notify('con:error', client));
pool.onPacket((raw) => {
  try {
    const msg = JSON.parse(raw.data);
    notify('packet', msg);
    if (msg.message) return notify('message', client, msg);
    // eslint-disable-next-line no-console
    // console.log('recv', JSON.stringify(msg, null, 4));
    if (msg.resp) notify('resp', client, msg);
    else if (msg.op) notify(`op:${msg.op.type}`, client, msg);
    else notify('message', client, msg);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    notify('packet:error', client, raw, err);
  }
});

export default client;
