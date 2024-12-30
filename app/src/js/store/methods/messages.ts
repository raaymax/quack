/* global JsonWebKey */
import { client } from '../../core';
import { StateType, createMethod } from '../store';
import { Message } from '../../types';
import { OutgoingMessageCreate } from '../../core/types';
import * as enc from '@quack/encryption';

type Query = {
  channelId: string;
  parentId?: string,
  before?: string,
  after?: string,
  limit?: number,
}

type Messages = Message | Message[];

export const getDirectChannelKey = async (channelId: string, state: StateType): Promise<JsonWebKey | null> => {
  const channel = state.channels[channelId];
  if(channel.channelType === 'DIRECT' && client.api.privateKey) {
    const otherId = channel.users.find((u:string) => u !== state.me);
    if(otherId){
      const userPublicKey = state.users[otherId]?.publicKey;
      return await enc.deriveSharedKey(client.api.privateKey, userPublicKey);
    }
    if(channel.users.length === 1 && channel.users[0] === state.me) {
      const userPublicKey = state.users[state.me]?.publicKey;
      return await enc.deriveSharedKey(client.api.privateKey, userPublicKey);
    }
    console.warn('direct channel - no encryption key');
  }
  return null;
}

export const decryptMessage = async (msg: Messages, channelId: string, state: StateType): Promise<Message[]> => {
  try{ 
    const encryptionKey = await getDirectChannelKey(channelId, state);

    if(!encryptionKey){
      console.warn('no encryption key - skipping decryption');
      return [msg].flat();
    }
    const e = enc.encryptor(encryptionKey);

    return Promise.all([msg].flat().map(async (msg) => {
      if (!msg.secured) return msg;

      const {encrypted, _iv, ...rest} = msg;
      const decrypted = await e.decrypt({encrypted, _iv});
      return {...rest, ...decrypted, secure: false};
    }));
  }catch(e){
    console.error(e);
    throw e;
  }
}
const encryptMessage = async (msg: OutgoingMessageCreate, sharedKey: JsonWebKey) => {
  const {clientId, channelId, parentId, ...data} = msg;
  const base =  {
    clientId,
    channelId,
    parentId: parentId === null ? undefined : parentId,
  };

  const e = enc.encryptor(sharedKey);
  return {
    ...base,
    ...await e.encrypt(data)
  };

}

export const load = createMethod('messages/load', async (query: Query, { actions, client, dispatch, getState, methods }) => {
  await dispatch(methods.users.init());
  const state = getState();
  const preprocess = async (m: Message[]) => decryptMessage(m, query.channelId, state);
  try{ 
    const data = await client.messages.fetch({
      limit: 50,
      preprocess,
      ...query,
    });
    dispatch(actions.messages.add(data));
    return data;
  }catch(e){
    console.error(e);
  }
});

export const addDecrypted = createMethod('messages/addDecrypted', async (msg: Message, { actions, dispatch, getState}) => {
  if (!msg.secured){
    return dispatch(actions.messages.add(msg));
  }

  const state = getState();
  try{ 
    const decrypted = await decryptMessage(msg, msg.channelId, state);
    dispatch(actions.messages.add(decrypted));
  }catch(e){
    console.error(e);
  }
});


export const sendMessage = createMethod('messages/sendMessage', async ({ payload: msg}: {payload: OutgoingMessageCreate}, { dispatch, actions, getState }) => {
  dispatch(actions.messages.add({ ...msg, userId: getState().me, pending: true, info: null }));
  try {
    const state = getState();
    const encryptionKey = await getDirectChannelKey(msg.channelId, state);
    if( encryptionKey ) {
      return await client.api.sendMessage(await encryptMessage(msg, encryptionKey));
    }
    return await client.api.sendMessage(msg);
  } catch (err) {
    console.error(err);
    dispatch(actions.messages.add({
      clientId: msg.clientId,
      channelId: msg.channelId,
      parentId: msg.parentId,
      info: {
        msg: 'Sending message failed - click here to resend',
        type: 'error',
        action: 'resend',
      },
    }));
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
