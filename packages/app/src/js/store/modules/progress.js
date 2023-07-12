import {createModule} from '../tools';

export default createModule({
  name: 'progress',
  initialState: [],
  reducers: {
    add: (state, action) => {
      const newState = [...state];
      [action.payload].flat().forEach((progress) => {
        const idx = newState.findIndex((item) => item.channelId === progress.channelId
          && item.userId === progress.userId && item.parentId === progress.parentId);
        if (idx !== -1) {
          newState[idx] = { ...newState[idx], ...progress };
          return newState;
        }
        newState.push(progress);
      });
      return newState;
    },
  },
  methods: {
    loadBadges: () => async ({actions}, getState, {client}) => {
      const { data } = await client.req({
        type: 'badges:load',
      });
      actions.progress.add(data);
    },

    loadProgress: (stream) => async ({actions}, getState, {client}) => {
      if (!stream.channelId) return;
      const { data } = await client.req({
        type: 'progress:load',
        channelId: stream.channelId,
        parentId: stream.parentId,
      });
      actions.progress.add(data);
    },

    update: (messageId) => async ({actions}, getState, {client}) => {
      const { data } = await client.req({
        type: 'progress:update',
        messageId,
      });
      actions.progress.add(data);
    },
  },
});
