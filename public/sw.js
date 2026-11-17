const CACHE_NAME = 'lenkyx-cosmic-phonk-v1';
const STATIC_ASSETS = ['/', '/manifest.json', '/covers/icon-192.png', '/covers/avatar.jpg', '/covers/banner.jpg'];

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
  const url = new URL(event.request.url);
  // Always hit network for API and audio streaming
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/storage/') || url.pathname.startsWith('/audio/')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
