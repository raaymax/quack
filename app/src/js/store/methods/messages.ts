/* global APP_VERSION */
import { client } from '../../core';
import { createCounter } from '../../utils';
import {
  createMethod, StateType, DispatchType, ActionsType,
} from '../store';
import { Stream, Message, MessageBody } from '../../types';
import { SerializeInfo, processUrls } from '../../serializer';
import { IncommingError, OutgoingCommandExecute, OutgoingMessageCreate } from '../../core/types';
import { encryptor } from '@quack/encryption';

type Query = {
  channelId: string;
  parentId?: string,
  before?: string,
  after?: string,
  limit?: number,
}

export const load = createMethod('messages/load', async (query: Query, { actions, client, dispatch, getState }) => {
  const state = getState();
  const userKey = state.config.encryptionKey;
  const channelKey = state.config.channels.find((c) => c.channelId === query.channelId)?.encryptionKey;
  const key = userKey && channelKey ? await encryptor(userKey).decrypt(channelKey) : null;
  try{ 
    const data = await client.messages.fetch({
      limit: 50,
      encryptionKey: key,
      ...query,
    });
    dispatch(actions.messages.add(data));
    return data;
  }catch(e){
    console.error(e);
  }
});

type Reaction = {
  id: string;
  text: string;
}

export const addReaction = createMethod('messages/addReaction', async (args: Reaction, { actions, client, dispatch }) => {
  const req = await client.req({
    type: 'message:react',
    id: args.id,
    reaction: args.text.trim(),
  });
  dispatch(actions.messages.add(req.data));
});
