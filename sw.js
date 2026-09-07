// DONIA SMART CLASSE — service worker v1
const CACHE_NAME = 'donia-smart-classe-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ns => Promise.all(ns.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(r => {
        if (r && r.ok && e.request.url.startsWith(self.location.origin)) {
          const copy = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        }
        return r;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
