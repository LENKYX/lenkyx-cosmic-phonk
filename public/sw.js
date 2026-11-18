const CACHE_NAME = 'lenkyx-cosmic-phonk-v32';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/covers/icon-192.png',
  '/covers/avatar.jpg',
  '/covers/banner.jpg',
  '/covers/album-official.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Never intercept API proxy or live backend mutations
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/state')) {
    return;
  }

  // Cache-first for static covers, JS/CSS assets, and local audio files
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/covers/') ||
      url.pathname.startsWith('/audio/') ||
      url.pathname === '/manifest.json')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const net = fetch(event.request)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  // Network-first with offline cache fallback for HTML & /api/state
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const home = await caches.match('/');
          if (home) return home;
        }
        return new Response('Offline', { status: 503 });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
