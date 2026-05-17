const CACHE = 'pd-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/'])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// ── Handle incoming push from Cloudflare Worker ───────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'Dashboard', body: '' };
  if (e.data) {
    try { data = e.data.json(); } catch { data.body = e.data.text(); }
  }

  e.waitUntil(
    // Only show banner if the app isn't in the foreground (avoids double-notif)
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const isFocused = clientList.some(c => c.focused);
      if (isFocused) return; // App is open — JS timer will handle it
      return self.registration.showNotification(data.title, {
        body: data.body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: data.tag || 'dashboard-push',
        requireInteraction: false,
      });
    })
  );
});

// ── Open the app when a notification is tapped ────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow('./');
    })
  );
});
