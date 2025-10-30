// Service Worker for Geo Explorer Application
// sw.js
const CACHE_VERSION = "v0.0.7";
const CACHE_NAME = `geo-explorer-cache-${CACHE_VERSION}`;
const TILE_CACHE = `map-tiles-${CACHE_VERSION}`;
const DATA_CACHE = `geojson-data-${CACHE_VERSION}`;
const BASE_PATH = "/geo-explorer/";

const urlsToCache = [
  `${BASE_PATH}`,
  `${BASE_PATH}app-state.js`,
  `${BASE_PATH}config.js`,
  `${BASE_PATH}favicon.ico`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}index.js`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}app/dropdown-01-view.js`,
  `${BASE_PATH}app/dropdown-02-layer.js`,
  `${BASE_PATH}app/dropdown-03-feature.js`,
  `${BASE_PATH}app/dropdown-04-county.js`,
  `${BASE_PATH}app/dropdown-05-subdist.js`,
  `${BASE_PATH}app/layer-cd118.js`,
  `${BASE_PATH}app/layer-counties.js`,
  `${BASE_PATH}app/layer-mn-precincts.js`,
  `${BASE_PATH}app/layer-states.js`,
  `${BASE_PATH}app/list-us-states.js`,
  `${BASE_PATH}app/map-viewer.js`,
  `${BASE_PATH}app/store-county.js`,
  `${BASE_PATH}app/store-feature.js`,
  `${BASE_PATH}components/DropdownControlGroup.js`,
  `${BASE_PATH}components/MapContainer.js`,
  `${BASE_PATH}components/ci-header/ci-header.js`,
  `${BASE_PATH}components/ci-footer/ci-footer.js`,
  `${BASE_PATH}styles/index.css`,
  "https://civic-interconnect.github.io/app-core/styles/tokens.css",
  "https://civic-interconnect.github.io/app-core/styles/themes.css",
  "https://civic-interconnect.github.io/app-core/styles/base.css",
  // Pre-cache Leaflet assets
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];

// Install event -pre-cache essential files
self.addEventListener("install", (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete old version caches
            return cacheName.startsWith('geo-explorer-cache-') ||
                   cacheName.startsWith('map-tiles-') ||
                   cacheName.startsWith('geojson-data-');
          })
          .filter(cacheName => {
            return cacheName !== CACHE_NAME && 
                   cacheName !== TILE_CACHE && 
                   cacheName !== DATA_CACHE;
          })
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - intelligent routing based on request type
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  // Handle tile requests - Stale While Revalidate
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(TILE_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              // Only cache successful responses
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse); // Fallback to cache if network fails
          
          // Return cached version immediately, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Handle GeoJSON data - Network First with Cache Fallback
  if (url.pathname.endsWith('.geojson') || url.pathname.includes('/geo-data/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(cache => {
        return fetch(event.request)
          .then(networkResponse => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed, try cache
            return cache.match(event.request).then(cachedResponse => {
              if (cachedResponse) {
                console.log('[SW] Serving GeoJSON from cache (offline)');
                return cachedResponse;
              }
              // No cache available
              return new Response('{"error": "Offline and no cached data available"}', {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            });
          });
      })
    );
    return;
  }
  
  // Handle app assets - Cache First
  if (url.hostname === location.hostname || 
      url.hostname === 'civic-interconnect.github.io' ||
      url.hostname === 'unpkg.com') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
          // Optionally cache new resources
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }
  
  // Default - Network only for everything else
  event.respondWith(fetch(event.request));
});

// Optional: Handle background sync for deferred data updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});