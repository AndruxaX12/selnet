/* СелНет — Оптимизиран PWA Service Worker с Разширени Известия */
const STATIC = "static-v3"; // bump версия при промени
const SHELL = ["/","/bg","/manifest.webmanifest"]; // махнахме иконите докато не се създадат реални

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then(c => c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== STATIC).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // не кеширай admin/api
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  // Документи (navigate): SWR
  if (req.mode === "navigate") {
    event.respondWith((async ()=>{
      try {
        const fresh = await fetch(req);
        const c = await caches.open(STATIC);
        c.put(req, fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(req)) || (await caches.match("/"));
      }
    })());
    return;
  }

  // assets/images: cache-first само за съществуващи файлове
  if (/\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith((async ()=>{
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      const c = await caches.open(STATIC);
      c.put(req, res.clone());
      return res;
    })());
    return;
  }
});

console.log("СелНет Service Worker готов с кеш версия static-v3");
