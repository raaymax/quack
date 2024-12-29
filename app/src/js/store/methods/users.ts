import { createMethod } from '../store';

export const init = createMethod('users/load', async (_arg, { actions, client, dispatch, getState }) => {
  const state = getState();
  if (state.users.length) {
    return;
  }
  const res = await client.req({ type: 'user:getAll' });
  dispatch(actions.users.add(res.data));
});

export const load = createMethod('users/load', async (_arg, { actions, client, dispatch }) => {
  const res = await client.req({ type: 'user:getAll' });
  dispatch(actions.users.add(res.data));
});
