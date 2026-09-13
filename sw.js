(function () {
  "use strict";

  var CACHE = "memoria-magica-v1";

  var PRECACHE = [
    "./",
    "index.html",
    "manifest.json",
    "fonts/fonts.css",
    "fonts/fredoka-latin.woff2",
    "fonts/fredoka-latin-ext.woff2",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/icon-maskable-192.png",
    "icons/icon-maskable-512.png",
    "icons/apple-touch-icon.png"
  ];

  self.addEventListener("install", function (event) {
    event.waitUntil(
      caches.open(CACHE).then(function (cache) {
        return cache.addAll(PRECACHE);
      }).then(function () {
        return self.skipWaiting();
      })
    );
  });

  self.addEventListener("activate", function (event) {
    event.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(
          keys.filter(function (key) { return key !== CACHE; })
            .map(function (key) { return caches.delete(key); })
        );
      }).then(function () {
        return self.clients.claim();
      })
    );
  });

  self.addEventListener("fetch", function (event) {
    var req = event.request;
    if (req.method !== "GET") return;

    if (req.mode === "navigate") {
      event.respondWith(
        fetch(req).then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put("index.html", copy); });
          return res;
        }).catch(function () {
          return caches.match("index.html");
        })
      );
      return;
    }

    if (new URL(req.url).origin === self.location.origin) {
      event.respondWith(
        caches.match(req).then(function (cached) {
          if (cached) return cached;
          return fetch(req).then(function (res) {
            if (res.ok) {
              var copy = res.clone();
              caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
            }
            return res;
          });
        })
      );
    }
  });
})();
