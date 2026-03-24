const CACHE_NAME = 'netescol-v10';
const API_CACHE_NAME = 'netescol-api-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/bus.svg',
  '/bus-marker.svg',
];

// Read-only API endpoints that can be cached for offline use
const CACHEABLE_API_PATTERNS = [
  '/api/trpc/schools.list',
  '/api/trpc/routes.list',
  '/api/trpc/vehicles.list',
  '/api/trpc/drivers.list',
  '/api/trpc/students.list',
  '/api/trpc/stops.list',
  '/api/trpc/municipality.get',
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
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Check if URL is a cacheable API endpoint
function isCacheableAPI(url) {
  return CACHEABLE_API_PATTERNS.some((pattern) => url.includes(pattern));
}

// Fetch handler with strategies
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip socket.io
  if (event.request.url.includes('socket.io')) return;

  // API calls: network-first with cache fallback for read-only endpoints
  if (event.request.url.includes('/api/')) {
    if (isCacheableAPI(event.request.url)) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              const clone = response.clone();
              caches.open(API_CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
          .catch(() => {
            return caches.match(event.request).then((cached) => {
              if (cached) return cached;
              return new Response(
                JSON.stringify({ error: 'Offline - dados indisponiveis' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
              );
            });
          })
      );
    }
    // Non-cacheable API calls pass through to network (no interception)
    return;
  }

  // Static assets: network-first, cache fallback
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
          // For navigation requests, return the cached index.html (SPA)
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Notify all clients about online/offline status changes
function notifyClients(type, data) {
  self.clients.matchAll({ type: 'window' }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({ type, ...data });
    });
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'NetEscol', body: event.data ? event.data.text() : 'Nova notificacao' };
  }

  const title = data.title || 'NetEscol';

  // Icones por tipo de notificacao
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

// Receber mensagens da pagina principal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_PERSISTENT_NOTIFICATION') {
    // Notificacao persistente para manter o SW ativo durante rastreamento GPS
    self.registration.showNotification(event.data.title || 'GPS Ativo', {
      body: event.data.body || 'Rastreamento em tempo real ativo',
      icon: '/bus.svg',
      badge: '/bus.svg',
      tag: 'gps-tracking',
      requireInteraction: true,
      silent: true,
      data: { url: '/rastreamento', type: 'gps_tracking' },
    });
  }
  if (event.data && event.data.type === 'HIDE_PERSISTENT_NOTIFICATION') {
    // Fechar notificacao quando parar rastreamento
    self.registration.getNotifications({ tag: 'gps-tracking' }).then(notifications => {
      notifications.forEach(n => n.close());
    });
  }
  if (event.data && event.data.type === 'SYNC_LOCATIONS') {
    // Repassar para clientes
    clients.matchAll().then(clientList => {
      clientList.forEach(client => {
        client.postMessage({ type: 'SYNC_LOCATIONS' });
      });
    });
  }
  if (event.data && event.data.type === 'CLEAR_API_CACHE') {
    // Limpar cache de API quando solicitado (ex: apos login/logout)
    caches.delete(API_CACHE_NAME);
  }
});

// Background sync (para enviar posicoes GPS acumuladas offline)
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
