const CACHE_NAME = 'netescol-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/bus.svg',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls - always go to network
  if (event.request.url.includes('/api/')) return;

  // Skip socket.io
  if (event.request.url.includes('socket.io')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, return the cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'NetEscol', body: event.data ? event.data.text() : 'Nova notificacao' };
  }

  const title = data.title || 'NetEscol';

  // Ícones por tipo de notificação
  const typeEmoji = {
    trip_started: 'Viagem iniciada',
    student_boarded: 'Aluno embarcou',
    student_dropped: 'Aluno desembarcou',
    arrived: 'Onibus chegou',
    trip_completed: 'Viagem concluida',
    delay: 'Atraso detectado',
    alert: 'Alerta',
  };

  const options = {
    body: data.body || 'Nova notificacao',
    icon: '/bus.svg',
    badge: '/bus.svg',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || data.type || 'netescol',
    renotify: true,
    requireInteraction: data.type === 'delay' || data.type === 'alert',
    data: {
      url: data.url || '/',
      type: data.type,
      tripId: data.tripId,
      studentId: data.studentId,
    },
    actions: data.type === 'trip_started' ? [
      { action: 'track', title: 'Rastrear' },
      { action: 'dismiss', title: 'Dispensar' },
    ] : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let targetUrl = '/';
  const data = event.notification.data || {};

  if (event.action === 'track' || data.type === 'trip_started' || data.type === 'arrived' || data.type === 'student_boarded') {
    targetUrl = '/portal-responsavel';
  } else if (data.url) {
    targetUrl = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Tentar focar em uma janela existente
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Background sync (para enviar posições GPS acumuladas offline)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-locations') {
    event.waitUntil(
      // O app principal vai lidar com o flush da fila quando voltar online
      clients.matchAll().then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: 'SYNC_LOCATIONS' });
        });
      })
    );
  }
});
