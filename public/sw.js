const CACHE_NAME = 'pockets-pwa-v2';

// Resolved against the worker's own scope so this works from a subpath
// such as https://user.github.io/Pockets/ as well as from the domain root.
const scopeUrl = (path) => new URL(path, self.registration.scope).toString();
const ASSETS_TO_CACHE = ['./', './index.html', './manifest.json', './favicon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // Cache assets one by one so a single missing file can't abort the install
      .then((cache) => Promise.all(
        ASSETS_TO_CACHE.map((path) => cache.add(scopeUrl(path)).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

const putInCache = (request, response) => {
  if (response && response.status === 200 && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;
  // Only manage this app's own files (Google Fonts etc. go straight to the network)
  if (new URL(request.url).origin !== self.location.origin) return;

  // Pages: network first so a new deploy shows up right away, cache when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => putInCache(request, response))
        .catch(() => caches.match(request).then((hit) => hit || caches.match(scopeUrl('./index.html'))))
    );
    return;
  }

  // Everything else: serve from cache, refresh in the background
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => putInCache(request, response)).catch(() => cached);
      return cached || network;
    })
  );
});
