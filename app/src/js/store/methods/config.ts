import { createMethod } from '../store';

export const load = createMethod('config/load', async (_arg, { actions, client, dispatch }) => {
  const { data: [config] } = await client.req({ type: 'user:config' });
  dispatch(actions.config.set(config));
  return config;
});
