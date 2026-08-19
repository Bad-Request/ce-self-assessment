// Caches the app shell on first visit so the app works offline afterwards.
// Bump CACHE_VERSION whenever a cached file's contents change.
const CACHE_VERSION = 'ce-self-assessment-v11';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/style.css',
  './assets/data.js',
  './assets/js/app.js',
  './assets/js/assessments.js',
  './assets/js/dashboard.js',
  './assets/js/dom.js',
  './assets/js/download.js',
  './assets/js/framework.js',
  './assets/js/model.js',
  './assets/js/storage.js',
  './assets/js/ui-shell.js',
  './assets/js/utils.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
