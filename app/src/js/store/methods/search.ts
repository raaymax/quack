import { Message } from '../../types';
import { StateType, createMethod } from '../store';
import { decryptMessage } from './messages';

type Query = {
  channelId: string;
  text: string;
};


export const find = createMethod('search/find', async ({ channelId, text }: Query, { actions, client, dispatch, methods, getState}) => {
  await dispatch(methods.users.init());
  const state: StateType = getState();
  if(!state.channels[channelId]){
    await dispatch(methods.channels.find(channelId));
  }
  const preprocess = async (m: Message[]) => decryptMessage(m, channelId, state);
  if(state.channels[channelId]?.channelType === 'DIRECT') {
    const results: Message[] = [];

    const data = await client.messages.fetch({
      limit: 1000,
      preprocess,
      channelId,
    });

    results.push(...data.filter((m) => {
      if(m.secured) return false;
      return m.flat.includes(text);
    }));

    dispatch(actions.search.push({ text, data: results, searchedAt: new Date().toISOString() }));

    return;
  }

  const data = await client.req({ type: 'message:search', channelId, text });
  dispatch(actions.search.push({ text, data: data.data, searchedAt: new Date().toISOString() }));
});
