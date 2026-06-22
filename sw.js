const CACHE_NAME = 'posture-tracker-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/storage.js',
  './js/dashboard.js',
  './js/training.js',
  './js/records.js',
  './js/progress.js',
  './js/photos.js',
  './js/app.js',
  './icons/icon.svg',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Dynamically generate PWA icons
  if (url.pathname.endsWith('/icons/icon-192.png') || url.pathname.endsWith('/icons/icon-512.png')) {
    const size = url.pathname.includes('192') ? 192 : 512;
    event.respondWith(generateIconResponse(size));
    return;
  }

  // Cache-first for static assets, network-first for others
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});

async function generateIconResponse(size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.22;

  ctx.fillStyle = '#007AFF';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, r);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(size * 0.48)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('体', size / 2, size / 2 + size * 0.04);

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return new Response(blob, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } });
}
