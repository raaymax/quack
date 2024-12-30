import { Message } from '../../types';
import { createMethod } from '../store';
import { decryptMessage } from './messages';

export const load = createMethod('pins/load', async (channelId: string, { actions, client, dispatch, getState, methods }) => {
  await dispatch(methods.users.init());
  const state = getState();
  const preprocess = async (m: Message[]) => decryptMessage(m, channelId, state);

  dispatch(actions.pins.clear(channelId));
  const data = await client.messages.fetch({
    limit: 1000,
    preprocess,
    pinned:true,
    channelId,
  });
  dispatch(actions.pins.add(data));
});

type Pin = {
  id: string;
  channelId: string;
};

export const pin = createMethod('pins/pin', async ({ id, channelId }: Pin, {
  methods, client, dispatch,
}) => {
  const req = await client.req({
    type: 'message:pin',
    id,
    pinned: true,
  });
  dispatch(methods.messages.addDecrypted(req.data));
  await dispatch(methods.pins.load(channelId));
});

export const unpin = createMethod('pins/unpin', async ({ id, channelId }: Pin, {
  methods, client, dispatch,
}) => {
  const req = await client.req({
    type: 'message:pin',
    id,
    pinned: false,
  });
  dispatch(methods.messages.addDecrypted(req.data));
  await dispatch(methods.pins.load(channelId));
});
