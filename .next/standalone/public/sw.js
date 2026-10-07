// VisaCheck service worker — store-nothing by design.
//
// CACHE STRATEGY:
//   A) SHELL CACHE — stale-while-revalidate, versioned (visacheck-shell-v1).
//   B) RULES DATA — NEVER cache POST /api/check or its responses. Pass-through to network.
//   C) TURNSTILE  — pass-through, never cached.
//   D) RANGE / non-GET / non-200 responses — never cached.
//
// Hard rule: only GET requests with HTTP 200 responses may enter the cache.
// Hard rule: no request body, no user data, no /api/check response ever enters the cache.

const SHELL_CACHE = 'visacheck-shell-v2';

// Static shell — pre-cached on install. The shell contains NO user data.
// (Google Fonts CSS is treated as cross-origin; only the CSS file itself is cached.)
// Note: Next.js dev/prod assets live at /_next/static/* and are SWR-cached on demand
// rather than pre-cached (their hashed names change between builds).
const SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Sora:wght@600;800&display=swap',
];

// --- Install: pre-cache the shell, then activate fast.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Use addAll with care — if any request fails, install fails (which is what we want
      // for the shell, since a broken shell is worse than no shell).
      try {
        await cache.addAll(SHELL_ASSETS);
      } catch (err) {
        // Best-effort: some cross-origin requests (Google Fonts) may be blocked by
        // ad blockers in certain browsers. Log and continue — the SWR pass-through
        // will fetch them on demand later.
        console.warn('[sw] shell pre-cache partial failure:', err);
      }
      await self.skipWaiting();
    })()
  );
});

// --- Activate: evict any old "visacheck-shell-*" caches, claim clients fast.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('visacheck-shell-') && k !== SHELL_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// --- Fetch: route by strategy.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // B) NEVER intercept POST /api/check — pass straight through.
  //    (And never cache any POST at all.)
  if (req.method !== 'GET') {
    // For POST/PUT/DELETE we still want offline-friendly behaviour, but we never cache.
    // Pass-through and let the app.js catch block surface the error (e_offline toast).
    event.respondWith(fetch(req).catch(() => new Response('offline', { status: 503 })));
    return;
  }

  // C) Turnstile — pass-through, never cache.
  const url = new URL(req.url);
  if (url.origin === 'https://challenges.cloudflare.com') {
    event.respondWith(fetch(req));
    return;
  }

  // D) /api/* routes — pass-through, never cached by the SW.
  //    The browser's HTTP cache (controlled by response Cache-Control headers)
  //    still handles them appropriately, but the SW itself never intercepts.
  //    This is the strict "shell-only" interpretation: API responses (including
  //    announcements) never enter the SW cache.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req).catch(() => new Response('offline', { status: 503 })));
    return;
  }

  // A) Shell: stale-while-revalidate.
  //    - Only GET, only HTTP 200 may be cached (opaque/cors errors / 3xx-5xx skipped).
  //    - Range requests are passed through (D).
  if (req.headers.get('range')) {
    event.respondWith(fetch(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});

/**
 * Standard SWR for the shell. Serves from cache if available, fetches in background,
 * updates the cache on HTTP 200 success, serves fresh next time.
 */
async function staleWhileRevalidate(req) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(req, { ignoreSearch: false });

  const networkPromise = fetch(req)
    .then((res) => {
      // ONLY-GET + ONLY-200 rule. Opaque responses (type 'opaque'), redirects, 4xx/5xx are skipped.
      if (
        res &&
        res.status === 200 &&
        res.type !== 'opaque' &&
        req.method === 'GET'
      ) {
        // Clone before consuming — the original goes back to the page.
        cache.put(req, res.clone()).catch(() => {
          /* ignore cache write errors (e.g. quota) — never break the response */
        });
      }
      return res;
    })
    .catch(() => null);

  // Serve cached immediately if present, fall back to network.
  if (cached) {
    // Kick off the background refresh but return cached right away.
    networkPromise.catch(() => {});
    return cached;
  }

  // Nothing cached — wait for network, fall back to a friendly offline shell page for navigations.
  const net = await networkPromise;
  if (net) return net;

  if (req.mode === 'navigate') {
    // App shell fallback — try cached '/', then a tiny inline offline page.
    const fallback = await cache.match('/');
    if (fallback) return fallback;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>VisaCheck — offline</title>' +
        '<style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:30rem;margin:auto;color:#0f766e}</style>' +
        '<h1>You appear to be offline</h1><p>VisaCheck needs a connection to run the check. ' +
        'Reconnect and reload.</p>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // For non-navigation requests with no cache and no network: 503.
  return new Response('offline', { status: 503 });
}

// Allow the page to trigger an immediate update (skipWaiting + claim).
self.addEventListener('message', (event) => {
  if (event.data === 'vc-skip-waiting') {
    self.skipWaiting();
  }
});
