// RepeatlyOS Service Worker — offline-first cache
const CACHE_NAME = 'repeatlyos-v1';
const STATIC_ASSETS = ['/', '/dashboard', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Only ever intercept real http(s) requests — a browser extension's own
  // requests (chrome-extension://, moz-extension://, etc.) can pass through
  // this handler too since `fetch` fires for every request the page makes,
  // not just ones RepeatlyOS itself issued, and the Cache API throws
  // synchronously on any non-http(s) scheme. Found live: a font-rendering
  // extension's chrome-extension:// request crashed this handler with an
  // unhandled promise rejection.
  if (!e.request.url.startsWith('http')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone)).catch(() => {});
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
