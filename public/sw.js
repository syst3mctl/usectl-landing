/* usectl landing service worker — the revisit killer.
 *
 * WHAT IT DOES: the first visit downloads ~7MB (phone) / ~9MB (desktop)
 * of models plus the hashed bundles; without this file every RETURN visit
 * pays whatever the host's cache headers allow it to re-ask for. with it,
 * everything heavy is served from the on-disk Cache Storage in ~0ms and
 * the site works offline after one visit.
 *
 * STRATEGY, by path — TWO buckets since round 48, because one bucket
 * meant every MODEL bump also re-downloaded ~2.2MB of decoders, vendor
 * scripts and hashed bundles that had not changed at all:
 *   /models/               → MODELS bucket, cache-first. bump MV below
 *     whenever public/models content changes (tools/mobile-assets.sh
 *     reminds about it).
 *   /vendor/ /draco/ /basis/ /assets/ /commercial/ + /assets/fonts/
 *                          → STATIC bucket, cache-first. bump SV only
 *     when THOSE change (vendored libs, decoders, fonts).
 *   documents (.html, /)   → network-first, cache fallback, in the
 *     MODELS bucket (they change with deploys anyway).
 *   everything else        → straight through.
 *
 * NAVIGATION PRELOAD (round 48): without it the browser boots this
 * worker BEFORE the document fetch may start — 50-300ms of cold SW
 * startup serialized in front of every revisit's HTML. enable() runs
 * the request in parallel; the navigate branch consumes preloadResponse.
 */
var MV = 'usectl-models-v4';   /* v4: the laptop went KTX2 — same url, new bytes; v3 caches hold the webp one */
var SV = 'usectl-static-v1';
var MODELS = /^\/models\//;
var STATIC = /^\/(vendor|draco|basis|assets|commercial)\//;

self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(Promise.all([
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== MV && k !== SV; }).map(function(k){ return caches.delete(k); }));
    }),
    self.registration.navigationPreload ? self.registration.navigationPreload.enable() : Promise.resolve()
  ]).then(function(){ return self.clients.claim(); }));
});

function cacheFirst(bucket, req){
  return caches.open(bucket).then(function(c){
    return c.match(req).then(function(hit){
      if (hit) return hit;
      return fetch(req).then(function(res){
        if (res && res.ok) c.put(req, res.clone());
        return res;
      });
    });
  });
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;   // cdn/gtag pass through untouched

  if (MODELS.test(url.pathname)){ e.respondWith(cacheFirst(MV, req)); return; }
  if (STATIC.test(url.pathname)){ e.respondWith(cacheFirst(SV, req)); return; }

  if (req.mode === 'navigate' || /\.html$/.test(url.pathname)){
    // network-first: fresh html when online, last-known html when not.
    // preloadResponse is that same network request already in flight.
    e.respondWith(caches.open(MV).then(function(c){
      var net = e.preloadResponse
        ? e.preloadResponse.then(function(pre){ return pre || fetch(req); })
        : fetch(req);
      return net.then(function(res){
        if (res && res.ok) c.put(req, res.clone());
        return res;
      }).catch(function(){ return c.match(req); });
    }));
  }
});
