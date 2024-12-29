import { createMethod } from '../store';
import { getDirectChannelKey, decryptMessage } from './messages';

export const load = createMethod('pins/load', async (channelId: string, { actions, client, dispatch, getState, methods }) => {
  await dispatch(methods.users.init());
  dispatch(actions.pins.clear(channelId));
  const req = await client.req({
    type: 'message:pins',
    channelId,
    limit: 50,
  });
  const decrypted = await decryptMessage(req.data, channelId, getState());
  console.log('decrypted', decrypted);
  dispatch(actions.pins.add(decrypted));
});

type Pin = {
  id: string;
  channelId: string;
};

export const pin = createMethod('pins/pin', async ({ id, channelId }: Pin, {
  actions, methods, client, dispatch,
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
  actions, methods, client, dispatch,
}) => {
  const req = await client.req({
    type: 'message:pin',
    id,
    pinned: false,
  });
  dispatch(methods.messages.addDecrypted(req.data));
  await dispatch(methods.pins.load(channelId));
});
