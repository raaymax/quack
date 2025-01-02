import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { ViewMessage as MessageType } from '../../types';

type MessagesState = {
  data: MessageType[];
  loading: boolean;
  status: 'live' | 'archived';
  hovered: string | null;
};

export default createSlice({
  name: 'messages',
  initialState: {
    data: [],
    loading: false,
    status: 'live',
    hovered: null,
  } as MessagesState,
  reducers: {
    hover: (state, action: PayloadAction<string | null>) => ({ ...state, hovered: action.payload ?? null }),
    setStatus: (state, action) => ({ ...state, status: action.payload as 'live' | 'archived' }),
    loadingFailed: (state, action) => ({ ...state, loadingFailed: action.payload }),
    loading: (state) => ({ ...state, loading: true }),
    loadingDone: (state) => ({ ...state, loading: false }),
    clear: (state, action) => {
      const { data } = state;
      const { stream: { parentId, channelId } } = action.payload;
      const ids = data
        .filter(((m) => m.channelId === channelId && (!parentId || m.parentId === parentId)))
        .map((m) => m.id);

      return { ...state, data: data.filter((m) => !ids.includes(m.id)) };
    },

    add: (state, action) => {
      const newState = { ...state, data: [...state.data] };
      [action.payload].flat().map(i => ({...i, info: i.info || null})).forEach((msg) => {
        if (msg.createdAt) {
          msg.createdAt = (new Date(msg.createdAt)).toISOString();
        }
        const idx = newState.data.findIndex((m) => (m.id && m.id === msg.id)
          || (m.clientId && m.clientId === msg.clientId));

        if (idx !== -1) {
          newState.data[idx] = { ...newState.data[idx], ...msg };
          return;
        }
        let pos = newState.data.findIndex((m) => m.createdAt < msg.createdAt);
        if (pos === -1 && newState.data.some((m) => m.createdAt > msg.createdAt)) pos = newState.data.length;
        newState.data.splice(pos, 0, msg);
      });
      return newState;
    },

    rm: (state, action) => {
      const {channelId, clientId, userId, appId} = action.payload;
      const newState = { ...state, data: [...state.data] };
      const idx = newState.data.findIndex((m) => m.channelId === channelId && m.clientId === clientId && (m.userId === userId || m.appId === appId));
      if (idx !== -1) {
        newState.data.splice(idx, 1);
      }
      return newState;
    },

    takeOldest: (state, action) => {
      const newState = { ...state, data: [...state.data] };
      const { stream: { channelId, parentId }, count } = action.payload;

      const channel = newState.data
        .filter((m) => m.channelId === channelId && m.parentId === parentId && m.id !== parentId);
      const toRemove = new Set(channel
        .slice(0, Math.max(channel.length - count, 0))
        .map((m) => m.id));
      newState.data = newState.data.filter((m) => !toRemove.has(m.id));
      return newState;
    },

    takeYoungest: (state, action) => {
      const newState = { ...state, data: [...state.data] };
      const { stream: { channelId, parentId }, count } = action.payload;

      const channel = newState.data
        .filter((m) => m.channelId === channelId && m.parentId === parentId && m.id !== parentId);

      const toRemove = new Set(channel.map((m) => m.id));
      channel
        .slice(0, Math.min(count, channel.length))
        .forEach((m) => toRemove.delete(m.id));

      newState.data = newState.data.filter((m) => !toRemove.has(m.id));
      return newState;
    },

    toggleEdit: (state, action) => {
      const id = action.payload;
      const newState = { ...state, data: [...state.data] };
      const idx = newState.data.findIndex((m) => (m.id && m.id === id));
      if (idx !== -1) {
        newState.data[idx] = { ...newState.data[idx], editing: !newState.data[idx].editing };
        return newState;
      }
      return state;
    },
    editClose: (state, action) => {
      const id = action.payload;
      const newState = { ...state, data: [...state.data] };
      const idx = newState.data.findIndex((m) => (m.id && m.id === id));
      if (idx !== -1) {
        newState.data[idx] = { ...newState.data[idx], editing: false };
        return newState;
      }
      return state;
    },
  },
});
