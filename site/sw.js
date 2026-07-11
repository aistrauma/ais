/* AIS Trauma Reference service worker — precache the whole app (including the
   dictionary PDF) so it installs to a home screen and works fully offline. */
const CACHE = "ais-ref-2026-07-11-2";
const PRECACHE = [
  "./",
  "manifest.webmanifest",
  "assets/pdf.min.js",
  "assets/pdf.worker.min.js",
  "assets/AIS08-Dictionary-redacted.pdf",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache-first with background refresh. The AI endpoint is network-only. */
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.includes("/.netlify/")) return;
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const refresh = fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || refresh;
    })
  );
});
