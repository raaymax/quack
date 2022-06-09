import { createNotifier } from '../utils.js';
import {watchCid, getCid} from './channel';

const [notify, watch] = createNotifier();
const [notifyCurr, watchCurr] = createNotifier();

let current = null
let channels = [];

watchCid((cid) => {
  current = getChannel({cid});
  notifyCurr(current);
});

export const getCurrent = () => current;
export const getChannel = ( q = {}) => channels.find((c) => c.cid === q.cid || c.name === q.name)

export const getChannels = () => channels;

export const setChannels = (c) => {
  channels = c;
  notify(channels);
};
export const clearChannels = () => {
  channels = [];
  notify(channels);
};
export const addChannel = (channel) => {
  const existing = channels.find((c) => c.cid === channel.cid);
  if (existing) {
    Object.assign(existing, channel);
    notify(channels);
    return;
  }
  let pos = channels.findIndex((c) => c.createdAt > channel.createdAt);
  if (pos === -1 && channels.some((c) => c.createdAt < channel.createdAt)) pos = channels.length;
  channels = [
    ...channels.slice(0, pos),
    channel,
    ...channels.slice(pos),
  ];
  if (getCid() === channel.cid) {
    current = channel;
    notifyCurr(current);
  }
  notify(channels);
};
export const rmChannel = (cid) => {
  const pos = channels.findIndex((c) => c.cid === cid);
  if (pos === -1) return;
  channels.splice(pos, 1);
  notify(channels);
};

export const watchChannels = watch;
export const watchCurrent = watchCurr;
