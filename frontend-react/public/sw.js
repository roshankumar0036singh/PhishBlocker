// Simple Service Worker for PhishBlocker PWA
const CACHE_NAME = 'phishblocker-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/shield.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Skip Vite/HMR internal assets in development
    if (
        event.request.url.includes('@vite') ||
        event.request.url.includes('@react-refresh') ||
        event.request.url.includes('hot-update')
    ) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                // Return a fallback or just let it fail silently for non-essential assets
                console.log('SW: Fetch failed for', event.request.url);
            });
        })
    );
});
