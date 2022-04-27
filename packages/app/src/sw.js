import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import firebaseConfig from './firebaseConfig';

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (...args) => {
  // eslint-disable-next-line no-console
  console.log('FCM notif: ', args);
})

const EXTERNAL_ASSETS = [
  'https://unpkg.com/quill-emoji@0.2.0/dist/quill-emoji.js',
  'https://cdn.quilljs.com/1.3.6/quill.js',
  'https://cdn.quilljs.com/1.3.6/quill.snow.css',
  'https://unpkg.com/quill-emoji@0.2.0/dist/quill-emoji.css',
  'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap',
];

const ASSETS = [
  '/assets/sound.mp3',
  '/assets/icons/favicon-16x16.png',
  '/assets/icons/mstile-150x150.png',
  '/assets/icons/favicon-32x32.png',
  '/assets/icons/android-chrome-512x512.png',
  '/assets/icons/apple-touch-icon.png',
  '/assets/icons/android-chrome-192x192.png',
  '/assets/emoji_list.json',
  '/assets/favicon.ico',
  '/assets/fontawesome/webfonts/fa-v4compatibility.ttf',
  '/assets/fontawesome/webfonts/fa-brands-400.woff2',
  '/assets/fontawesome/webfonts/fa-solid-900.ttf',
  '/assets/fontawesome/webfonts/fa-regular-400.ttf',
  '/assets/fontawesome/webfonts/fa-solid-900.woff2',
  '/assets/fontawesome/webfonts/fa-regular-400.woff2',
  '/assets/fontawesome/webfonts/fa-brands-400.ttf',
  '/assets/fontawesome/webfonts/fa-v4compatibility.woff2',
  '/assets/fontawesome/css/all.css',
  '/assets/fontawesome/css/all.min.css',
  '/manifest.json',
  '/sw.js',
  '/app.css',
  '/index.html',
  '/app.js',
  '/',
];

self.addEventListener('install', (event) => {
  async function onInstall() {
    const cache = await caches.open('static');
    await cache.addAll(ASSETS);
    await cache.addAll(EXTERNAL_ASSETS);
  }
  event.waitUntil(onInstall(event));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'PUT') {
    return;
  }
  if (EXTERNAL_ASSETS.includes(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        }),
    );
  } else if (ASSETS.includes(event.request.url)) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request)),
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(async () => {
    await Promise.all(ASSETS.map((asset) => cache.delete(asset)));
  });
});
