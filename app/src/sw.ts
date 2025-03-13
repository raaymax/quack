/* global NotificationEvent */

import { precacheAndRoute } from "workbox-precaching";
import * as navigationPreload from "workbox-navigation-preload";
// import { registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

const files = (self.__WB_MANIFEST) || [];

if (files.length) {
  precacheAndRoute(files);
  navigationPreload.enable();
}
/*

const shareTargetHandler = async ({ event }) => {
  getOpenClient().then((client) => {
    if (client) {
      event.request.formData().then((formData) => {
        const data = {};

        for (const [key, val] of formData.entries()) {
          data[key] = val;
        }
        client.postMessage({ type: 'share', data });
      });
    }
  });
  event.respondWith(Response.redirect('/'));
}

registerRoute(
  '/share',
  shareTargetHandler,
  'POST',
);

async function getOpenClient(): Promise<Client> {
  return clients.matchAll({
    includeUncontrolled: true,
    type: 'window',
  }).then((clientList) => clientList[0]);
}

*/

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || "New Notification";
    const options = {
      body: data.body || "You have a new notification.",
      icon: data.icon || "/icon.png",
      badge: data.badge || "/badge.png",
      silent: false,
      vibrate: [100, 50, 100],
      tag: "notif",
      data: {
        ...data,
        url: data.url || "/",
      },
    };

    event.waitUntil(handleNotification(title, options, data));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(handleNotificationClick(event));
});

async function handleNotificationClick(event: NotificationEvent) {
  const link = event.notification.data.url;
  if (!link) return;
  const url = new URL(link, self.location.href);
  const originUrl = new URL(self.location.origin);
  if (url.host !== originUrl.host) {
    return;
  }
  let client = await getWindowClient(url);
  if (!client) {
    client = await self.clients.openWindow(link);
    await wait(3210);
  } else {
    client = await client.focus();
  }
  if (!client) return;
  return client.postMessage({
    type: "notification:click",
    ...event.notification.data,
  });
}

type NotificationData = {
  title: string;
  body: string;
  icon: string;
  badge: string;
  url: string;
};

type NotificationOptions = {
  body: string;
  icon: string;
  badge: string;
  silent: boolean;
  vibrate: number[];
  tag: string;
  data: NotificationData;
};

async function handleNotification(
  title: string,
  options: NotificationOptions,
  data: NotificationData,
) {
  await self.registration.showNotification(title, options);
  const clientList = await getClientList();
  for (const client of clientList) {
    client.postMessage({ type: "notification", data });
  }
}

function getClientList() {
  return self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
}

async function getWindowClient(url: URL) {
  const clientList = await getClientList();
  for (const client of clientList) {
    const clientUrl = new URL(client.url, self.location.href);
    if (url.host === clientUrl.host) {
      return client;
    }
  }
  return null;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
