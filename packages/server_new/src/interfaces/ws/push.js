
const { channelRepo } = require('../infra/database/db');
const pack = require('../../package.json');
const conf = require('../../../../chat.config');

module.exports = {
  setupPushNotifications: async (self, msg) => {
    if (!msg.subscription) return msg.error({ code: 'MISSING_SUBSCRIPTION' });
    if (!self.user) return msg.error({ code: 'ACCESS_DENIED' });
    self.sub = msg.subscription;
    await sessionRepo.update(self.session.id, {
      pushSubscription: msg.subscription,
    });

    return msg.ok();
  },
  setupFcm: async (self, msg) => {
    if (!msg.fcmToken) return msg.error({ code: 'MISSING_SUBSCRIPTION' });
    if (!self.user) return msg.error({ code: 'ACCESS_DENIED' });
    self.fcmToken = msg.fcmToken;
    await sessionRepo.update(self.session.id, {
      fcmToken: msg.fcmToken,
    });

    return msg.ok();
  },

  sendConfig: async (self) => self.send({
    type: 'setConfig',
    config: {
      appVersion: pack.version,
      applicationServerKey: process.env.VAPID_PUBLIC,
    },
  }),

  notifyOther: async (self, msg) => {
    if (!msg.user) return Promise.resolve();
    if (process.env.NODE_ENV === 'test') return Promise.resolve(); // FIXME: feature disable or separate config for testing?
    if (!msg.message) return Promise.resolve();
    const channel = await channelRepo.get({ cid: msg.channel });
    const sess = await sessionRepo.getByUsers({
      userId: channel.users.filter((user) => user.toHexString() !== self.user.id),
    });
    const tokens = Object.keys(
      sess
        .map((s) => s.fcmToken)
        .reduce((acc, token) => ({ ...acc, [token]: true }), {}),
    ).filter((k) => !!k);

    if (tokens.length === 0) return Promise.resolve();
    // eslint-disable-next-line array-callback-return
    const message = {
      tokens,
      data: {
        channel: msg.channel,
      },
      notification: {
        title: `${msg.user?.name || 'Guest'} on ${msg.channel}`,
        body: msg.flat,
      },
      android: {
        collapse_key: msg.user.id,
        notification: {
          ...(self.user.avatarUrl ? { imageUrl: self.user.avatarUrl } : {}),
          icon: 'stock_ticker_update',
          color: '#7e55c3',
          sound: 'https://chat.codecat.io/assets/sound.mp3',
        },
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1,
          },
        },
        fcm_options: {
          image: self.user.avatarUrl,
        },
      },
      webpush: {
        headers: {
          image: self.user.avatarUrl,
        },
        fcm_options: {
          link: `${conf.serverWebUrl}/#${msg.channel}`,
        },
        notification: {
          silent: false,
          vibrate: [200, 100, 200],
          badge: self.user.avatarUrl,
          image: self.user.avatarUrl,
        },
      },
    };
    return getMessaging().sendMulticast(message);
  },
};
