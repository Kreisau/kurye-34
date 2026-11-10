// Kurye 34 service worker: offline app shell + font cache.
// Same-origin files: served from cache, refreshed in the background (new version shows on next launch).
// Bump VERSION to force a clean cache after structural changes.
const VERSION = 'v6';
const SHELL = 'kurye34-shell-' + VERSION;
const FONTS = 'kurye34-fonts';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'js/main.js', 'js/g.js', 'js/config.js', 'js/sprites.js', 'js/save.js', 'js/track.js', 'js/game.js',
  'js/traffic.js', 'js/rivals.js', 'js/render.js', 'js/ui.js', 'js/input.js', 'js/audio.js', 'js/rating.js', 'js/tutorial.js', 'js/story.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('kurye34-shell-') && k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// fresh: rebuild the request by URL (navigate requests can't take init options) and bypass the browser HTTP cache (revalidate with ETag) so a new deploy reaches the SW cache.
function staleWhileRevalidate(req, cacheName, opts, fresh) {
  return caches.open(cacheName).then(cache =>
    cache.match(req, opts).then(hit => {
      const net = fetch(fresh ? new Request(req.url, { cache: 'no-cache' }) : req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(staleWhileRevalidate(req, SHELL, { ignoreSearch: true }, true));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(staleWhileRevalidate(req, FONTS));
  }
});
