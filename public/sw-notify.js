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
