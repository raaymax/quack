import { createSlice } from '@reduxjs/toolkit';
import { ViewMessage } from '../../types';

type PinsState = {
  [channelId: string]: ViewMessage[];
};

export default createSlice({
  name: 'pins',
  initialState: {} as PinsState,
  reducers: {
    add: (state, action) => {
      const newState = { ...state };
      [action.payload].flat().forEach((msg) => {
        const { channelId } = msg;

        const list = newState[channelId] ? [...newState[channelId]] : [];
        newState[channelId] = list;
        if (msg.createdAt) {
          msg.createdAt = (new Date(msg.createdAt)).toISOString();
        }
        const idx = list.findIndex((m) => (m.id && m.id === msg.id)
          || (m.clientId && m.clientId === msg.clientId));
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...msg };
          return;
        }
        let pos = list.findIndex((m) => m.createdAt < msg.createdAt);
        if (pos === -1 && list.some((m) => m.createdAt > msg.createdAt)) pos = list.length;
        list.splice(pos, 0, msg);
      });
      return newState;
    },
    clear: (state, action) => {
      const newState = { ...state };
      const channelId = action.payload;
      newState[channelId] = [];
      return newState;
    },
  },
});
