// Service Worker for Fitness Tracker PWA
// Provides offline support with strategic caching

const CACHE_VERSION = 'v3';
const STATIC_CACHE_NAME = `fitness-tracker-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `fitness-tracker-dynamic-${CACHE_VERSION}`;
const API_CACHE_NAME = `fitness-tracker-api-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// API routes to cache
const API_ROUTES = [
  '/api/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old version caches
              return cacheName.startsWith('fitness-tracker-') &&
                     cacheName !== STATIC_CACHE_NAME &&
                     cacheName !== DYNAMIC_CACHE_NAME &&
                     cacheName !== API_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests - Network First with Cache Fallback
  if (isApiRequest(url)) {
    event.respondWith(networkFirstWithCacheFallback(request, API_CACHE_NAME));
    return;
  }

  // Handle navigation requests - Network First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Handle static assets - Cache First with Network Update
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstWithNetworkUpdate(request, STATIC_CACHE_NAME));
    return;
  }

  // Default: Network First with Dynamic Cache
  event.respondWith(networkFirstWithDynamicCache(request));
});

// Check if request is for API
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname.includes('supabase');
}

// Check if request is for static asset
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname.startsWith('/_next/static/');
}

// Strategy: Network First with Cache Fallback (for API)
async function networkFirstWithCacheFallback(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Clone response before caching
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return a JSON error response for API requests
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Strategy: Network First with Offline Fallback (for navigation)
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, trying cache:', request.url);

    // Try to return cached page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page as fallback
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }

    // Final fallback - basic offline response
    return new Response(
      '<html><body><h1>Offline</h1><p>Please check your internet connection.</p></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Strategy: Cache First with Network Update (for static assets)
async function cacheFirstWithNetworkUpdate(request, cacheName) {
  const cachedResponse = await caches.match(request);

  // Start network fetch in background to update cache
  const networkFetch = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        // Clone before using to avoid "body already used" error
        const responseToCache = networkResponse.clone();
        caches.open(cacheName).then((cache) => {
          cache.put(request, responseToCache);
        });
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network if no cache
  const networkResponse = await networkFetch;
  if (networkResponse) {
    return networkResponse;
  }

  // No cache, no network
  return new Response('Resource not available offline', { status: 503 });
}

// Strategy: Network First with Dynamic Cache (default)
async function networkFirstWithDynamicCache(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response('Resource not available offline', { status: 503 });
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Background sync for offline actions (if supported)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-workouts') {
    event.waitUntil(syncWorkouts());
  }

  if (event.tag === 'sync-meals') {
    event.waitUntil(syncMeals());
  }
});

// Placeholder sync functions
async function syncWorkouts() {
  console.log('[SW] Syncing workouts...');
  // Implementation would sync offline workout data
}

async function syncMeals() {
  console.log('[SW] Syncing meals...');
  // Implementation would sync offline meal data
}
