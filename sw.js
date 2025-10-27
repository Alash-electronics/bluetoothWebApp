// Service Worker для PWA оффлайн режима
const CACHE_NAME = 'ble-controller-v1.0.0';
const BASE_PATH = '/bluetoothWebApp/';

// Ресурсы для кэширования
const STATIC_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'logo.png',
  BASE_PATH + 'vite.svg',
  BASE_PATH + 'manifest.json',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Failed to cache assets:', err);
      });
    })
  );
  // Активировать новый SW сразу
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Начать контролировать все страницы сразу
  self.clients.claim();
});

// Стратегия: Network First, падаем на Cache
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к chrome-extension и другим схемам
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Клонируем ответ, так как он может быть использован только один раз
        const responseClone = response.clone();

        // Кэшируем успешные ответы
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => {
        // Если сеть недоступна, пытаемся вернуть из кэша
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Если запрос к HTML странице и нет в кэше - показываем оффлайн страницу
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match(BASE_PATH + 'index.html');
          }
        });
      })
  );
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
