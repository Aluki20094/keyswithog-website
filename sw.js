// Service Worker for Keys with OG Website
// Provides offline caching and performance optimizations

const CACHE_NAME = 'keys-with-og-v1.2';
const STATIC_CACHE = 'keys-with-og-static-v1.2';

// Resources to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/images/oscar-hero.jpg',
  '/images/og-logo.jpg',
  '/images/silverado.jpg',
  '/images/equinox.jpg',
  '/images/blazer.jpg',
  '/images/tahoe.jpg',
  '/images/colorado.jpg',
  '/images/trax.jpg',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap',
  'https://fonts.gstatic.com/s/bebasneue/v9/JTUSjIg1_i6t8kCHKm459Wlhzg.woff2',
  'https://fonts.gstatic.com/s/dmsans/v11/rP2Hp2ywxg089UriCZOIHTWEBlwu8Q.woff2'
];

// API endpoints to cache with short TTL
const API_CACHE_PATTERNS = [
  /\/api\/inventory$/,
  /\/api\/generate-referral$/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(url => {
          // Skip external URLs that might fail CORS
          return !url.startsWith('https://fonts.g');
        }));
      })
      .then(() => {
        console.log('✅ Static assets cached');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('⚠️ Cache installation failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all open tabs
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except fonts)
  if (url.origin !== location.origin && !url.hostname.includes('fonts.g')) {
    return;
  }

  // API requests - Cache first, then network
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                // Serve from cache immediately
                fetch(request)
                  .then((networkResponse) => {
                    // Update cache in background
                    if (networkResponse.ok) {
                      cache.put(request, networkResponse.clone());
                    }
                  })
                  .catch(() => {
                    // Network failed, but we have cache
                  });

                return cachedResponse;
              }

              // Not in cache, fetch from network
              return fetch(request)
                .then((response) => {
                  if (response.ok) {
                    cache.put(request, response.clone());
                  }
                  return response;
                });
            });
        })
    );
    return;
  }

  // Static assets - Cache first with network fallback
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response.ok && response.status === 200) {
              const responseClone = response.clone();

              caches.open(STATIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }

            return response;
          })
          .catch(() => {
            // Network failed and not in cache
            // Return offline fallback for HTML requests
            if (request.headers.get('accept').includes('text/html')) {
              return new Response(
                '<h1>Offline</h1><p>Please check your internet connection and try again.</p>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            }
          });
      })
  );
});

// Background sync for offline form submissions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      console.log('📤 Processing background sync');
      // Handle offline form submissions when back online
    }
  });
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERFORMANCE_MARK') {
    console.log('📊 Performance mark:', event.data.mark);
  }
});