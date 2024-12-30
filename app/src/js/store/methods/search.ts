import { Message } from '../../types';
import { StateType, createMethod } from '../store';
import { getDirectChannelKey } from './messages';

type Query = {
  channelId: string;
  text: string;
};


export const find = createMethod('search/find', async ({ channelId, text }: Query, { actions, client, dispatch, getState}) => {
  const state: StateType = getState();
  if(state.channels[channelId]?.channelType === 'DIRECT') {
    const results: Message[] = [];

    const encryptionKey = await getDirectChannelKey(channelId, state);
    if(!encryptionKey) {
      return;
    }
    
    const req: Parameters<typeof client.messages.fetch>[0] = {
      limit: 1000,
      encryptionKey,
      channelId,
    }

    const data = await client.messages.fetch(req);

    results.push(...data.filter((m) => {
      if(m.secured) return false;
      return m.flat.includes(text);
    }));

    dispatch(actions.search.push({ text, data: results, searchedAt: new Date().toISOString() }));

    return;
  }

  console.log('searching', text);
  const data = await client.req({ type: 'message:search', channelId, text });
  dispatch(actions.search.push({ text, data: data.data, searchedAt: new Date().toISOString() }));
});
