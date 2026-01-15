const CACHE_NAME = 'savit-v5';

// Keep this list same-origin only; cross-origin precache can fail (CORS) and break install.
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/api.js',
    '/js/app.js',
    '/vendor/MindElixirLite.css',
    '/vendor/MindElixirLite.iife.js',
    '/manifest.json'
];

async function precacheAssets() {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(
        STATIC_ASSETS.map(async (url) => {
            try {
                const request = new Request(url, { cache: 'reload' });
                const response = await fetch(request);
                if (response && response.ok) {
                    await cache.put(request, response);
                }
            } catch {
                // Ignore missing assets; SW should still install.
            }
        })
    );
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        precacheAssets().then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Never cache API requests.
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(JSON.stringify({ error: 'Offline', message: 'Você está offline' }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                })
            )
        );
        return;
    }

    // Navigation: network-first with offline fallback.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
                    return response;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    // Static assets: stale-while-revalidate.
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request)
                .then((response) => {
                    if (response && response.ok && url.origin === self.location.origin) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || fetchPromise;
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
