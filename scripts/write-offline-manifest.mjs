import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const next = new URL('../.next/', import.meta.url);
const buildId = (await readFile(new URL('BUILD_ID', next), 'utf8')).trim();
const assets = await readdir(new URL('static/', next), { recursive: true, withFileTypes: true });
const root = new URL('../', import.meta.url);
const staticRoot = fileURLToPath(new URL('static/', next));
const assetPath = (entry, directory) =>
  relative(directory, join(entry.parentPath ?? entry.path, entry.name)).split(sep).map(encodeURIComponent).join('/');

const shell = assets
  .filter((entry) => entry.isFile() && !entry.name.endsWith('.map'))
  .map((entry) => '/_next/static/' + assetPath(entry, staticRoot))
  .sort();

const pdfRoot = fileURLToPath(new URL('public/engine/pdf/', root));
const pdfAssets = (await readdir(pdfRoot, { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile() && !entry.name.startsWith('LICENSE'))
  .map((entry) => '/engine/pdf/' + assetPath(entry, pdfRoot));

const videoWrapper = (await readdir(new URL('public/engine/ffmpeg/', root)))
  .filter((file) => file.endsWith('.js'))
  .map((file) => '/engine/ffmpeg/' + file);

await writeFile(new URL('public/offline-assets.json', root), JSON.stringify({
  buildId,
  groups: {
    shell: [
      '/', '/formats', '/faq', '/about', '/favicon.ico', ...shell,
      '/docx-frame.js', '/engine/docx/docx-preview.min.js',
      '/engine/docx/jszip.min.js', ...pdfAssets,
    ],
    audio: ['/audio-worker.js', '/engine/mp3/lame.min.js'],
    video: [...videoWrapper, '/engine/video/ffmpeg-core.js', '/engine/video/ffmpeg-core.wasm'],
  },
}));
