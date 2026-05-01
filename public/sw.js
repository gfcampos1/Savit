const CACHE_NAME = 'savit-v37';

// Keep this list same-origin only; cross-origin precache can fail (CORS) and break install.
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/tokens.css',
    '/css/styles.css',
    '/js/api.js',
    '/js/router.js',
    '/js/utils/parse-natural.js',
    '/js/components/toast.js',
    '/js/components/command-palette.js',
    '/js/components/sidebar.js',
    '/js/components/detail-panel.js',
    '/js/components/tweaks-panel.js',
    '/js/app.js',
    '/vendor/MindElixirLite.css',
    '/vendor/MindElixirLite.iife.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable-192.png',
    '/icons/icon-maskable-512.png'
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
    // S5: do NOT auto-skipWaiting. Wait for the client to send SKIP_WAITING
    // (triggered by the "Recarregar" toast — bug §7.9).
    event.waitUntil(precacheAssets());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
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
