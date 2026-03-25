const CACHE_NAME = 'netescol-v11';

// Install - skip waiting immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate - delete ALL old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    })
  );
  self.clients.claim();
});

// Fetch - network first, no cache for JS/CSS/HTML
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('socket.io')) return;

  // Never cache API calls - always go to network
  if (event.request.url.includes('/api/')) return;

  // For navigation and assets: always try network first
  event.respondWith(
    fetch(event.request).catch(() => {
      // Only fallback to cache if network fails
      return caches.match(event.request).then((cached) => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'NetEscol', {
      body: data.body || 'Nova notificacao',
      icon: '/bus.svg',
      badge: '/bus.svg',
      tag: data.tag || 'netescol',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});

// Clear cache on message
self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
});
