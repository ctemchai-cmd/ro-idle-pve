/* Offline fallback only. Game code, content, Auth, API and player data are never cached here. */
const CACHE_PREFIX = 'ro-idle-pwa-';
const CACHE_NAME = CACHE_PREFIX + '__RO_PWA_VERSION__';
const PUBLIC_FILES = ['/offline.html', '/pwa/icon-192.png', '/pwa/icon-512.png', '/pwa/icon-maskable-512.png', '/pwa/apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PUBLIC_FILES)));
  // No skipWaiting: an update must not replace the worker of a running game.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) await caches.delete(name);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  // Leave every API/Auth/external/POST request to the browser without interception.
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('authorization') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/v1/')) return;
  if (PUBLIC_FILES.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache => (await cache.match(url.pathname)) || fetch(request)));
  } else if (request.mode === 'navigate' && ['/', '/play', '/auth', '/index.html', '/demo', '/roster', '/skill-preview'].includes(url.pathname)) {
    // Never persist HTML, PKCE codes, recovery fragments or authenticated responses.
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(async () => (await (await caches.open(CACHE_NAME)).match('/offline.html')) || new Response('Offline', { status: 503 })));
  }
});
