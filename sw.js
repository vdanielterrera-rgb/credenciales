// Guarda la página y la última copia de datos para que funcione sin señal.
const CACHE = "credenciales-v1";
const BASE = ["./", "index.html", "manifest.webmanifest", "logo_blanco.png", "icono-192.png", "icono-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // Datos y página: primero la red (lo más nuevo); si no hay señal, la última copia guardada.
  if (url.pathname.endsWith("datos.enc.json") || e.request.mode === "navigate") {
    const clave = url.pathname.endsWith("datos.enc.json") ? "datos.enc.json" : "index.html";
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(clave, copia)); }
        return r;
      }).catch(() => caches.match(clave))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
