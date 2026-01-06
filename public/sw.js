// Smart-Silo Storage Referee Service Worker
// Provides offline functionality and caching for PWA

const CACHE_NAME = 'smart-silo-v1.0.0';
const STATIC_CACHE_NAME = 'smart-silo-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'smart-silo-dynamic-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/market-data',
  '/api/crop-data'
];

// Maximum age for cached data (in milliseconds)
const CACHE_MAX_AGE = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  dynamic: 24 * 60 * 60 * 1000,     // 1 day
  api: 30 * 60 * 1000               // 30 minutes
};

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
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('smart-silo-')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
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

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         url.pathname.startsWith('/static/') ||
         url.pathname.startsWith('/icons/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg');
}

// Check if request is for an API endpoint
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') ||
         CACHEABLE_APIS.some(api => url.pathname.startsWith(api));
}

// Check if request is a navigation request
function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Handle static asset requests - Cache First strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cache is still valid
      const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
      const now = new Date();
      
      if (now - cacheDate < CACHE_MAX_AGE.static) {
        console.log('[SW] Serving static asset from cache:', request.url);
        return cachedResponse;
      }
    }

    // Fetch from network and update cache
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      const responseToCache = networkResponse.clone();
      
      // Add cache date header
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, cachedResponse);
      console.log('[SW] Cached static asset:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for static asset, serving from cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for critical assets
    if (request.url.includes('index.html') || request.url.endsWith('/')) {
      return new Response(getOfflinePage(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

// Handle API requests - Network First with cache fallback
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const responseToCache = networkResponse.clone();
      
      // Add cache date header
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, cachedResponse);
      console.log('[SW] Cached API response:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API, checking cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cache is still reasonably fresh
      const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
      const now = new Date();
      
      if (now - cacheDate < CACHE_MAX_AGE.api * 10) { // Allow stale data when offline
        console.log('[SW] Serving stale API data from cache:', request.url);
        
        // Add offline indicator header
        const headers = new Headers(cachedResponse.headers);
        headers.set('sw-offline', 'true');
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers
        });
      }
    }
    
    // Return offline API response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This data is not available offline. Please check your connection.',
      offline: true
    }), {
      status: 503,
      headers: { 
        'Content-Type': 'application/json',
        'sw-offline': 'true'
      }
    });
  }
}

// Handle navigation requests - serve app shell
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for navigation, serving app shell');
    
    const cachedResponse = await caches.match('/index.html');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(getOfflinePage(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle other dynamic requests
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      console.log('[SW] Cached dynamic resource:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving dynamic resource from cache:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-analysis-data') {
    event.waitUntil(syncAnalysisData());
  } else if (event.tag === 'sync-market-data') {
    event.waitUntil(syncMarketData());
  }
});

// Sync analysis data when back online
async function syncAnalysisData() {
  try {
    console.log('[SW] Syncing analysis data...');
    
    // Get pending analysis requests from IndexedDB
    const pendingRequests = await getPendingAnalysisRequests();
    
    for (const request of pendingRequests) {
      try {
        const response = await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        });
        
        if (response.ok) {
          await removePendingAnalysisRequest(request.id);
          console.log('[SW] Synced analysis request:', request.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync analysis request:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync market data when back online
async function syncMarketData() {
  try {
    console.log('[SW] Syncing market data...');
    
    const response = await fetch('/api/market-data');
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put('/api/market-data', response.clone());
      console.log('[SW] Market data synced successfully');
    }
  } catch (error) {
    console.error('[SW] Failed to sync market data:', error);
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage({ type: 'CACHE_STATUS', payload: status });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    case 'STORE_OFFLINE_DATA':
      storeOfflineData(payload).then(() => {
        event.ports[0].postMessage({ type: 'DATA_STORED' });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Utility functions
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  
  await Promise.all(
    cacheNames.map(cacheName => {
      if (cacheName.startsWith('smart-silo-')) {
        return caches.delete(cacheName);
      }
    })
  );
}

async function storeOfflineData(data) {
  // Store data in IndexedDB for offline access
  // This would be implemented based on specific offline data requirements
  console.log('[SW] Storing offline data:', data);
}

// Placeholder functions for IndexedDB operations
async function getPendingAnalysisRequests() {
  // Implementation would use IndexedDB to retrieve pending requests
  return [];
}

async function removePendingAnalysisRequest(id) {
  // Implementation would use IndexedDB to remove completed request
  console.log('[SW] Removing pending request:', id);
}

// Offline page HTML
function getOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Smart-Silo - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0;
          padding: 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .offline-container {
          max-width: 400px;
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        .offline-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 1rem;
        }
        .offline-message {
          color: #718096;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .retry-button {
          background: #4299e1;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
        }
        .retry-button:hover {
          background: #3182ce;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1 class="offline-title">You're Offline</h1>
        <p class="offline-message">
          Smart-Silo is not available right now. Please check your internet connection and try again.
        </p>
        <button class="retry-button" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>
  `;
}

console.log('[SW] Service worker script loaded');