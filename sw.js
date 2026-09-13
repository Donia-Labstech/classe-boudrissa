// DONIA SMART CLASSE — service worker v2
// استراتيجية: الشبكة أولًا لصفحات HTML (حتى تظهر التحديثات فورًا)
//              والذاكرة أولًا للأصول الثابتة (سرعة + عمل بدون إنترنت)
const CACHE_NAME = 'donia-smart-classe-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();               // فعّل النسخة الجديدة فورًا
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ns => Promise.all(ns.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())   // تولَّ التحكم في كل التبويبات المفتوحة
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const isHTML = req.mode === 'navigate'
    || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // ── الشبكة أولًا: أي تحديث ترفعه يظهر مباشرة ──
    e.respondWith(
      fetch(req)
        .then(r => {
          if (r && r.ok && req.url.startsWith(self.location.origin)) {
            const copy = r.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return r;
        })
        .catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // ── الأصول الثابتة: الذاكرة أولًا مع تحديث في الخلفية ──
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(r => {
        if (r && r.ok && req.url.startsWith(self.location.origin)) {
          const copy = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return r;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
