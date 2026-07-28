/* ==========================================================================
   SERVICE WORKER - LAVA-RÁPIDO PRO PWA
   ========================================================================== */

const CACHE_NAME = 'lava-rapido-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/main.css',
    './css/components.css',
    './js/config.js',
    './js/database.js',
    './js/auth.js',
    './js/ui.js',
    './js/app.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Instalação do Service Worker e Cache dos arquivos estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Armazenando arquivos estáticos no cache...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Ativação do Service Worker e limpeza de caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Removendo cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interceptação de requisições de rede
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                console.log('[Service Worker] Erro de rede na requisição:', event.request.url);
            });
        })
    );
});