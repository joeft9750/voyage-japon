/* Service Worker – Notre Voyage au Japon 2026
 * Stratégie : network-first pour les fichiers de l'app (toujours la dernière
 * version quand il y a du réseau), fallback sur le cache hors-ligne.
 */
const CACHE = 'japon2026-v1';
const CORE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './manifest.webmanifest',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/apple-touch-icon.png',
];

// Pré-cache des fichiers essentiels à l'installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Met en cache au mieux ; n'échoue pas si un fichier manque
      Promise.allSettled(CORE.map((url) => cache.add(url)))
    )
  );
});

// Nettoie les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // On ne gère que les GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Ne pas intercepter Firebase, Firestore ni les autres domaines tiers :
  // ils gèrent leur propre cache / temps réel.
  if (url.origin !== self.location.origin) return;

  // Network-first : essaie le réseau, met à jour le cache, sinon fallback cache.
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Clone et stocke la réponse fraîche
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => {
          if (cached) return cached;
          // Fallback ultime pour la navigation : la page d'accueil en cache
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
