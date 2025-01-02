 
import { UserConfig } from '../types';
import { client } from '../core';
import { OutgoingUserPushSubscribe } from '../core/types';

export const initNotifications = async (config: UserConfig) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', ({ data }) => {
      if (data.type) {
        client.emit(data.type, data);
      }
    });

    await register(config);
    if ('Notification' in window) {
      document.querySelector('body')?.addEventListener('click', () => {
        Notification.requestPermission((status) => {
          console.log('Notification permission status:', status);
        });
      }, { once: true });
    }
  }
};

const register = async (config: UserConfig, retry = false) => navigator.serviceWorker.getRegistration('/')
  .then((registration) => {
    if (!registration) throw new Error('No service worker registered');
    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: "" //config.vapidPublicKey,
    });
  })
  .then(async (subscription) => client.req({
    type: 'user:push:subscribe',
    ...subscription.toJSON(),
  } as OutgoingUserPushSubscribe))
  .then(() => console.log('Notifications service worker registered successfully'))
  .catch(() => {
    if (retry) return;
    navigator.serviceWorker.getRegistration('/')
      .then((registration) => registration?.pushManager?.getSubscription())
      .then((sub) => sub && sub.unsubscribe())
      .then(() => register(config, true));
  });
