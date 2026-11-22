const CACHE_NAME = 'rm-studio-shell-v2';
const CORE_FILES = [
  './',
  './index.html',
  './display.html',
  './display.css',
  './display.js',
  './xlsx.full.min.js',
  './DSEG7Classic-BoldItalic.ttf',
];

async function cacheShell() {
  const cache = await caches.open(CACHE_NAME);
  const indexResponse = await fetch('./index.html', { cache: 'no-cache' });
  await cache.put('./index.html', indexResponse.clone());
  const indexHtml = await indexResponse.text();
  const assets = [...indexHtml.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => !/^(?:https?:|data:|#)/i.test(url));
  const optionalFiles = [...new Set([...CORE_FILES.filter((file) => file !== './index.html'), ...assets])];
  await Promise.allSettled(optionalFiles.map(async (file) => {
    const requestUrl = new URL(file, self.registration.scope).href;
    const response = await fetch(requestUrl, { cache: 'no-cache' });
    if (response.ok) await cache.put(requestUrl, response);
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
