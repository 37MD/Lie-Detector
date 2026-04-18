const CACHE_NAME = 'lie-detector-cache-v2.24';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// ── 1. OFFLINE CACHING LOGIC ──────────────────────────────────────

// Install and Cache
self.addEventListener('install', event => {
  // force the waiting service worker to become the active service worker
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Serve from Cache

self.addEventListener('fetch', event => {
  // Only cache-first for same-origin shell files; always network-first for API calls
  const url = new URL(event.request.url);
  const isApiCall = url.hostname.includes('mfapi.in') ||
                    url.hostname.includes('npsnav.in') ||
                    url.hostname.includes('finance.yahoo.com') ||
                    url.hostname.includes('googleapis.com') ||
                    url.hostname.includes('flaticon.com');

  if (isApiCall) {
    // Network only for live data — never serve stale NAV from cache
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// ── 2. BACKGROUND PUSH NOTIFICATION LOGIC ─────────────────────────

// Listen for push events sent from your backend server
self.addEventListener('push', function(event) {
    if (!event.data) return;

    // Expected JSON payload from your eventual backend
    const data = event.data.json();
    
    const options = {
        body: data.body || 'A watched fund has triggered a system alert.',
        icon: '/icon.png', // Add a path to your app logo here
        badge: '/badge.png', // Small monochrome icon for Android bar
        vibrate: [200, 100, 200],
        tag: data.tag || 'ld-alert',
        requireInteraction: data.urgent || false, // Keeps critical alerts on screen
        data: {
            url: data.url || '/'
        }
    };

    // Show the notification even if the tab is closed
    event.waitUntil(
        self.registration.showNotification(data.title || 'Lie Detector Alert', options)
    );
});

// Handle the user clicking on the notification
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            const targetUrl = new URL(event.notification.data.url, self.location.origin).href;
            
            // Focus the app if it's already open in a background tab
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new tab to the dashboard
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});