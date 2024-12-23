import { createMethod } from '../store';
import { isMobile } from '../utils';
import { initNotifications } from './notifications';

declare global {
  interface Navigator{
    userAgentData?: {
      mobile: boolean
    }
  }
}

const initApp = createMethod('initApp', async (_arg, {
  dispatch, getState, methods, actions,
}) => {
  console.log('app init');
  if (isMobile()) {
    document.body.setAttribute('class', 'mobile');
  }
  dispatch(actions.connection.connected());
  dispatch(actions.info.reset());
  const config = await dispatch(methods.config.load({})).unwrap();
  console.log('config', config);
  dispatch(actions.stream.setMain(config.mainChannelId));
  await initNotifications(config);
  await dispatch(methods.users.load({}));
  await dispatch(methods.channels.load({}));
  await dispatch(methods.emojis.load({}));
  await dispatch(methods.progress.loadBadges({}));
});

let tryCount = 1;
export const init = createMethod('init', async (_arg, { dispatch, actions }) => {
  try {
    await dispatch(initApp({}));
    tryCount = 1;
  } catch (err) {
     
    console.log(err);
    if (tryCount < 4) {
      setTimeout(() => {
        dispatch(actions.system.initFailed(false));
        dispatch(init({}));
      }, 1000 * tryCount ** 2);
      tryCount += 1;
      return;
    }
    dispatch(actions.system.initFailed(true));
  }
});

export const reinit = createMethod('reinit', async (_arg, { dispatch, actions }) => {
  tryCount = 1;
  dispatch(actions.system.initFailed(false));
  await dispatch(init({}));
});
