/* Atlas Labs service worker — offline-first for the world's most deployed human */
const CACHE = 'atlas-v2.3';
const ASSETS = [
  './', './index.html', './manifest.json', './assets/favicon.svg', './assets/og.jpg',
  './assets/originals/IMG_3609_o.jpg','./assets/originals/IMG_5025_o.jpg','./assets/originals/IMG_5287_o.jpg',
  './assets/originals/IMG_5969_o.jpg','./assets/originals/IMG_6880_o.jpg','./assets/originals/IMG_7682_o.jpg',
  './assets/originals/photo_from_heic_o.jpg','./assets/originals/photo_from_png_o.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Google Fonts: stale-while-revalidate
  if (/fonts\.(googleapis|gstatic)\.com/.test(e.request.url)) {
    e.respondWith(
      caches.open(CACHE).then(async c => {
        const hit = await c.match(e.request);
        const fresh = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
        return hit || fresh;
      })
    );
    return;
  }
  // Same-origin: cache-first, network fallback
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    }))
  );
});
