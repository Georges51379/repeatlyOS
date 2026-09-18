// RepeatlyOS Service Worker — offline fallback cache.
//
// NETWORK-FIRST, not cache-first: this is a fast-moving app redeployed
// constantly, and cache-first (the previous strategy) meant a returning
// visitor could get stuck on an arbitrarily old build forever, since
// `cached || networkFetch` returned the stale cached response immediately
// whenever one existed, without ever waiting to see if the network had
// something newer. Found live (2026-09-18): "the site doesn't show my
// changes unless I hard-refresh" — a hard refresh bypasses the service
// worker entirely, which is exactly why that "fixed" it every time.
// Network-first still gives the offline-support goal this file exists
// for (falls back to whatever was last cached if the network fetch
// fails), it just never prefers a stale copy over a reachable network.
//
// CACHE_NAME bumped to v2 specifically so the `activate` handler's own
// cache-cleanup below actually deletes every existing visitor's old v1
// cache on this deploy — bump it again any time this file's own caching
// behavior changes, not for every unrelated app deploy (the network-first
// strategy means stale app code was never the cache's job to prevent).
const CACHE_NAME = 'repeatlyos-v2';
const STATIC_ASSETS = ['/manifest.json'];

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
  // synchronously on any non-http(s) scheme.
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(e.request)),
  );
});
