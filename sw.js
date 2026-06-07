/**
 * IRONFLOW CLUB - Service Worker (FIXED)
 * Only cache static assets (NO HTML caching)
 */

const CACHE_VERSION = 'v23';
const CACHE_NAME = `ironflow-${CACHE_VERSION}`;

/**
 * ONLY static assets (NO HTML files here)
 */
const STATIC_ASSETS = [
  '/manifest.json',

  '/assets/css/main.css',
  '/assets/css/leaderboard.css',
  '/assets/css/progress.css',
  '/assets/css/theme.css',
  '/assets/css/loader.css',

  '/assets/js/main.js',
  '/assets/js/leaderboard.js',
  '/assets/js/progress.js',
  '/assets/js/data-handler.js',
  '/assets/js/utils.js',
  '/assets/js/translations.js',
  '/assets/js/components.js',

  '/assets/components/header.html',
  '/assets/components/footer.html',

  '/tournament.html',
  '/admin.html',
  '/auth-guard.js',
  '/badminton.html',
  '/champions.html',
  '/members.html'
];

/* ─────────────────────────────────────────────
   INSTALL - cache static assets only
──────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ─────────────────────────────────────────────
   ACTIVATE - remove old caches
──────────────────────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('ironflow-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ─────────────────────────────────────────────
   FETCH STRATEGY
──────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* ── 1. Never cache proxy/API calls ── */
  if (url.hostname === 'ironflow-proxy.syed-mujeebprojects.workers.dev') {
    event.respondWith(fetch(event.request));
    return;
  }

  /* ── 2. Always network-first for Google Sheets ── */
  if (url.hostname === 'opensheet.elk.sh') {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  /* ── 3. NAVIGATION (HTML pages) → ALWAYS FRESH ── */
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  /* ── 4. Static assets → cache-first ── */
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) {
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });

        return response;
      });
    })
  );
});