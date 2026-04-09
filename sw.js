// ═══════════════════════════════════════════════════════
//  AQUANICS — Service Worker (sw.js)
//  Place this file at the ROOT of your GitHub Pages repo
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'aquanics-v1';
const STATIC = [
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/logo.png',
];

// ── Install ───────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(STATIC).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Push Notification ─────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'Aquanics', body: 'You have a new message!', icon: '/logo.png', tag: 'aquanics-notif' };
  try { data = { ...data, ...e.data.json() }; } catch(err) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon || '/logo.png',
      badge: '/logo.png',
      tag:   data.tag || 'aquanics-notif',
      data:  { url: data.url || '/' },
      vibrate: [200, 100, 200],
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
    })
  );
});

// ── Notification Click ────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const existing = list.find(c => c.url.includes(self.location.origin) && 'focus' in c);
        if (existing) { existing.focus(); existing.navigate(url); }
        else if (clients.openWindow) return clients.openWindow(url);
      })
  );
});

// ── Background Sync (offline support) ────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-messages') {
    // Retry failed message sends
    e.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Placeholder for offline message retry
}
