const prefix = 'salpa-offline-';
const indexCache = prefix + 'index';
const statePath = '/__salpa_offline_state';
const pages = new Set(['/', '/formats', '/faq', '/about']);
let preparation = Promise.resolve();

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

async function getState() {
  const index = await caches.open(indexCache);
  const saved = await index.match(statePath);
  return saved?.json();
}

async function getStatus() {
  const state = await getState();
  if (!state) return { shell: false, audio: false, video: false };

  const matches = await Promise.all(Object.entries(state.groups).map(async ([group, paths]) => {
    const cache = await caches.open(`${prefix}${state.buildId}-${group}`);
    const entries = await Promise.all(paths.map((path) => cache.match(path)));
    return [group, entries.every(Boolean)];
  }));
  const groups = Object.fromEntries(matches);
  return { shell: !!groups.shell, audio: !!groups.audio, video: !!groups.video };
}

async function prepare(selection, report) {
  const manifest = await fetch('/offline-assets.json', { cache: 'no-store' });
  if (!manifest.ok) throw new Error('offlineManifestFailed');
  const { buildId, groups } = await manifest.json();
  const selected = Object.fromEntries(
    Object.entries(groups).filter(([name]) => name === 'shell' || selection?.[name]),
  );
  const total = Object.values(selected).reduce((sum, paths) => sum + paths.length, 0);
  const kept = new Set([indexCache]);
  let loaded = 0;
  report({ loaded, total });

  for (const [name, paths] of Object.entries(selected)) {
    const key = `${prefix}${buildId}-${name}`;
    kept.add(key);
    const cache = await caches.open(key);
    const batchSize = name === 'shell' ? 8 : 1;
    for (let start = 0; start < paths.length; start += batchSize) {
      const batch = paths.slice(start, start + batchSize);
      await Promise.all(batch.map(async (path) => {
        if (!await cache.match(path)) {
          const response = await fetch(path, { cache: 'reload' });
          if (!response.ok) throw new Error('offlineSaveFailed');
          await cache.put(path, response);
        }
        loaded++;
        report({ loaded, total });
      }));
    }
  }

  const index = await caches.open(indexCache);
  await index.put(statePath, Response.json({ buildId, groups: selected }));
  await Promise.all((await caches.keys()).filter((key) => key.startsWith(prefix) && !kept.has(key))
    .map((key) => caches.delete(key)));
  return getStatus();
}

self.addEventListener('message', (event) => {
  const port = event.ports[0];
  if (!port) return;

  let result;
  if (event.data?.type === 'offline-status') {
    result = getStatus();
  } else if (event.data?.type === 'offline-prepare') {
    result = preparation.then(() => prepare(event.data.selection, (progress) => port.postMessage({ progress })));
    preparation = result.catch(() => undefined);
  } else {
    return;
  }

  event.waitUntil(result.then(
    (status) => port.postMessage({ status }),
    (error) => port.postMessage({ error: error?.message || 'offlineFailed' }),
  ));
});

async function cached(path, groups) {
  const state = await getState();
  if (!state) return undefined;
  for (const group of groups) {
    if (!state.groups[group]?.includes(path)) continue;
    const cache = await caches.open(`${prefix}${state.buildId}-${group}`);
    const saved = await cache.match(path);
    if (saved) return saved;
  }
  return undefined;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('range')) return;

  if (request.mode === 'navigate' && pages.has(url.pathname)) {
    event.respondWith(fetch(request).catch(async () =>
      await cached(url.pathname, ['shell']) ?? Response.error(),
    ));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/engine/') || url.pathname === '/audio-worker.js' ||
      url.pathname === '/docx-frame.js' ||
      url.pathname === '/favicon.ico') {
    event.respondWith((async () => {
      // Нормализация экранирования нужна для имён чанков Turbopack.
      const path = decodeURIComponent(url.pathname).split('/').map(encodeURIComponent).join('/');
      return await cached(path, ['shell', 'audio', 'video']) ?? fetch(request);
    })());
  }
});
