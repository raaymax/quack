import { client } from '../../core';
import { createMethod } from '../store';
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

export const load = createMethod('messages/load', async (query: Query, { actions, client, dispatch, getState }) => {
  const state = getState();
  let encryptionKey = null;


  try{ 
    const channel = state.channels[query.channelId];
    if(channel.channelType === 'DIRECT', client.api.privateKey) {
      const otherId = channel.users.find(u => u !== state.me);
      if(otherId){
        const userPublicKey = state.users[otherId]?.publicKey;
        encryptionKey = await enc.deriveSharedKey(client.api.privateKey, userPublicKey);
      }
      if(channel.users.length === 1 && channel.users[0] === state.me) {
        const userPublicKey = state.users[state.me]?.publicKey;
        encryptionKey = await enc.deriveSharedKey(client.api.privateKey, userPublicKey);
      }
    }

    const req: Parameters<typeof client.messages.fetch>[0] = {
      limit: 50,
      ...query,
    }
    if(encryptionKey){
      req.encryptionKey = encryptionKey;
    }
    console.log('req test', req);

    const data = await client.messages.fetch(req);
    console.log('data', data);
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
  let encryptionKey = null;


  try{ 
    const channel = state.channels[msg.channelId];
    if(channel.channelType === 'DIRECT', client.api.privateKey) {
      const otherId = channel.users.find(u => u !== state.me);
      if(otherId){
        const userPublicKey = state.users[otherId]?.publicKey;
        encryptionKey = await enc.deriveSharedKey(client.api.privateKey, userPublicKey);
      }
      if(channel.users.length === 1 && channel.users[0] === state.me) {
        const userPublicKey = state.users[state.me]?.publicKey;
        encryptionKey = await enc.deriveSharedKey(client.api.privateKey, userPublicKey);
      }
    }

    if(!encryptionKey){
      return dispatch(actions.messages.add(msg));
    }
    const {encrypted, _iv, ...rest} = msg;
    const e = enc.encryptor(encryptionKey);
    const decrypted = await e.decrypt({encrypted, _iv});
    dispatch(actions.messages.add({...rest, ...decrypted, secure: false}));
  }catch(e){
    console.error(e);
  }
});

const encryptMessage = async (msg: OutgoingMessageCreate, privateKey: JsonWebKey, publicKey: JsonWebKey) => {
  const sharedKey = await enc.deriveSharedKey(privateKey, publicKey);
  const {clientId, channelId, parentId, ...data} = msg;
  const base =  {
    clientId,
    channelId,
    parentId: parentId === null ? undefined : parentId,
  };

  const e = enc.encryptor(sharedKey);
  return {
    ...base,
    ...await e.encrypt(data),
    secured: true,
  };

}

export const sendMessage = createMethod('messages/sendMessage', async ({ payload: msg}: {payload: OutgoingMessageCreate}, { dispatch, actions, getState }) => {
  dispatch(actions.messages.add({ ...msg, userId: getState().me, pending: true, info: null }));
  try {
    const state = getState();
    const channel = state.channels[msg.channelId];
    if(channel.channelType === 'DIRECT', client.api.privateKey) {
      const otherId = channel.users.find(u => u !== state.me);
      if(otherId){
        const userPublicKey = state.users[otherId]?.publicKey;
        return await client.api.sendMessage(await encryptMessage(msg, client.api.privateKey, userPublicKey));
      }
      if(channel.users.length === 1 && channel.users[0] === state.me) {
        const userPublicKey = state.users[state.me]?.publicKey;
        return await client.api.sendMessage(await encryptMessage(msg, client.api.privateKey, userPublicKey));
      }
    }
    await client.api.sendMessage({...msg, secured: false});
  } catch (err) {
    console.log(err);
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
