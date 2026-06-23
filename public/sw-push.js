// Service worker dedicado a Web Push.
// Recebe notificações do servidor mesmo com a aba fechada.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'GestãoInt', body: 'Você tem uma notificação.' };
  try {
    if (event.data) payload = event.data.json();
  } catch (_) {
    if (event.data) payload.body = event.data.text();
  }

  const url = payload.url || '/calendario';
  const options = {
    body: payload.body,
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    tag: payload.tag,
    renotify: !!payload.tag,
    timestamp: payload.timestamp || Date.now(),
    data: { url },
    requireInteraction: payload.requireInteraction === true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/calendario';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          try {
            const u = new URL(client.url);
            const t = new URL(target, u.origin);
            if (u.origin === t.origin) {
              client.focus();
              client.postMessage({ type: 'web-push-navigate', url: target });
              return;
            }
          } catch (_) {}
        }
        return self.clients.openWindow(target);
      }),
  );
});
