/* usectl landing service worker — the revisit killer.
 *
 * WHAT IT DOES: the first visit downloads ~13MB (phone) / ~18MB (desktop)
 * of models plus the hashed bundles; without this file every RETURN visit
 * pays whatever the host's cache headers allow it to re-ask for. with it,
 * everything heavy is served from the on-disk Cache Storage in ~0ms and
 * the site works offline after one visit.
 *
 * STRATEGY, by path:
 *   /models/ /vendor/ /draco/ /basis/  → cache-first. immutable in
 *     practice; when one changes, bump VERSION below (the deploy ships a
 *     new sw.js, the browser installs it, activate() drops the old cache
 *     and the next fetch repopulates).
 *   /assets/               → cache-first. vite content-hashes these names.
 *   documents (.html, /)   → network-first, cache fallback: updates land
 *     on the next load, and a dead network still gets the last version.
 *   everything else        → straight through.
 *
 * BUMP VERSION WHENEVER public/models OR public/vendor CONTENT CHANGES
 * (tools/mobile-assets.sh reminds about it).
 */
var VERSION = 'usectl-v2';   /* v2: the model diet (dedup + dead-UV prune + wire cut) — v1 caches hold the fat files */
var HEAVY = /^\/(models|vendor|draco|basis|assets|commercial)\//;

self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== VERSION; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;   // cdn/gtag pass through untouched

  if (HEAVY.test(url.pathname)){
    // cache-first: a hit costs ~0ms and no bytes; a miss populates
    e.respondWith(caches.open(VERSION).then(function(c){
      return c.match(req).then(function(hit){
        if (hit) return hit;
        return fetch(req).then(function(res){
          if (res && res.ok) c.put(req, res.clone());
          return res;
        });
      });
    }));
    return;
  }

  if (req.mode === 'navigate' || /\.html$/.test(url.pathname)){
    // network-first: fresh html when online, last-known html when not
    e.respondWith(caches.open(VERSION).then(function(c){
      return fetch(req).then(function(res){
        if (res && res.ok) c.put(req, res.clone());
        return res;
      }).catch(function(){ return c.match(req); });
    }));
  }
});
