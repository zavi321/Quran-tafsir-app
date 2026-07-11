const CACHE_NAME = 'tafaseer-cache-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  const isData = url.includes('jsdelivr.net');

  if (isData) {
    // Data (Quran text + Tafsir): cache-first, save network response for offline use later
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(e.request).then((cached) => {
          const fetchPromise = fetch(e.request)
            .then((response) => {
              if (response && response.ok) cache.put(e.request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // App shell: cache-first, fallback to network
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
