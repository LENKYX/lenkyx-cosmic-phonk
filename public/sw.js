const CACHE_NAME = 'morro-gold-v80';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/covers/morro-gold-emblema-grosso.png',
  '/covers/morro-gold-emblema.png',
  '/covers/morro-gold-logo.png',
  '/covers/icon-edge-3d.png',
  '/covers/favicon.svg',
  '/covers/icon-192.png',
  '/covers/icon-512.png',
  '/covers/icon-maskable-512.png',
  '/covers/apple-touch-icon.png',
  '/covers/favicon.png',
  '/covers/lenkyx-app.ico',
  '/covers/avatar.jpg',
  '/covers/banner.jpg',
  '/covers/album-official.jpg',
  '/covers/favela-night-skyline.jpg',
  '/covers/ostentacao-motos-carros.jpg',
  '/covers/baile-verao-vip.jpg',
  '/shop/cria-modelo-kit.jpg',
  '/shop/mina-modelo-verao.jpg',
  '/shop/casal-ostentacao-baile.jpg',
  '/shop/role-narguile-bebidas.jpg',
  '/shop/estudio-tatuagem-crias.jpg',
  '/shop/barbearia-cortes-crias.jpg',
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

  // Cache-first ONLY for content-hashed /assets/ and static /audio/
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/audio/'))
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

  // Network-first with offline cache fallback for HTML, /covers/, /manifest.json & /api/state
  event.respondWith(
    fetch(event.request, { cache: event.request.mode === 'navigate' ? 'no-cache' : 'default' })
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
  } else if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => self.skipWaiting())
    );
  }
});
