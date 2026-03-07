// Zeta Barbershop — Notification Service Worker
// Handles push notifications for queue updates

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Listen for messages from the main app to show notifications
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, tag, icon } = event.data;
        self.registration.showNotification(title, {
            body,
            tag: tag || 'zeta-queue',
            icon: icon || '/vite.svg',
            badge: '/vite.svg',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            actions: event.data.actions || [],
        });
    }
});

// Handle notification click — focus the app tab
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            for (const client of clients) {
                if (client.url.includes('/queue/') && 'focus' in client) {
                    return client.focus();
                }
            }
            return self.clients.openWindow('/');
        })
    );
});

// VERY IMPORTANT: A fetch handler is required for the browser to consider this a valid PWA!
// This simple network-first strategy ensures PWA installability requirements are met.
self.addEventListener('fetch', (event) => {
    // Only handle GET requests or let the browser do its thing
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request).catch(async () => {
            // Fallback to cache if offline
            const cache = await caches.open('zeta-offline-cache');
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) return cachedResponse;
            // If requesting a page and offline, try returning root index.html
            if (event.request.mode === 'navigate') {
                return cache.match('/index.html');
            }
            return new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        })
    );
});
