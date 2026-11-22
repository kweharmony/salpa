const prefix = 'salpa-offline-';
const indexCache = prefix + 'index';
const statePath = '/__salpa_offline_state';
const pages = new Set(['/', '/formats', '/faq', '/about']);
let changes = Promise.resolve();

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

async function getState() {
  const saved = await caches.match(statePath, { cacheName: indexCache });
  return saved?.json();
}

async function getStatus() {
  const state = await getState();
  if (!state) return { buildId: null, shell: false, audio: false, video: false };

  const matches = await Promise.all(Object.entries(state.groups).map(async ([group, paths]) => {
    const cacheName = `${prefix}${state.buildId}-${group}`;
    const entries = await Promise.all(paths.map((path) => caches.match(path, { cacheName })));
    return [group, entries.every(Boolean)];
  }));
  const groups = Object.fromEntries(matches);
  return { buildId: state.buildId, shell: !!groups.shell, audio: !!groups.audio, video: !!groups.video };
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
      }));
      loaded += batch.length;
      report({ loaded, total });
    }
  }

  const index = await caches.open(indexCache);
  await index.put(statePath, Response.json({ buildId, groups: selected }));
  await removeCachesExcept(kept);
  return getStatus();
}

async function removeCachesExcept(kept) {
  const obsolete = (await caches.keys()).filter((key) => key.startsWith(prefix) && !kept.has(key));
  await Promise.all(obsolete.map((key) => caches.delete(key)));
}

async function clearOffline() {
  // Сначала отключаем выдачу сохранённой версии, затем освобождаем место.
  await caches.delete(indexCache);
  await removeCachesExcept(new Set());
  return getStatus();
}

function changeOffline(operation) {
  const result = changes.then(operation);
  changes = result.catch(() => undefined);
  return result.then(async (status) => {
    for (const client of await self.clients.matchAll({ type: 'window' })) {
      client.postMessage({ type: 'offline-changed', status });
    }
    return status;
  });
}

self.addEventListener('message', (event) => {
  const port = event.ports[0];
  if (!port) return;

  let result;
  if (event.data?.type === 'offline-status') {
    result = getStatus();
  } else if (event.data?.type === 'offline-prepare') {
    result = changeOffline(() => prepare(event.data.selection, (progress) => port.postMessage({ progress })));
  } else if (event.data?.type === 'offline-clear') {
    result = changeOffline(clearOffline);
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
    const cacheName = `${prefix}${state.buildId}-${group}`;
    const saved = await caches.match(path, { cacheName });
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
      // Нормализация экранирования нужна для имён чанков.
      const path = decodeURIComponent(url.pathname).split('/').map(encodeURIComponent).join('/');
      return await cached(path, ['shell', 'audio', 'video']) ?? fetch(request);
    })());
  }
});
