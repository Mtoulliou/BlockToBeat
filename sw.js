/* BlockToBeat : met l'app en cache pour qu'elle s'ouvre même sans réseau.
   Change VERSION à chaque mise à jour pour forcer le rafraîchissement. */
const VERSION = 'blocktobeat-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Page : réseau d'abord (pour avoir la dernière version), cache si hors ligne
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  // Polices Google et fichiers de l'app : cache d'abord, mis à jour en arrière-plan
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
