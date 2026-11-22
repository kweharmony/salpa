import { copyFile, cp, mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../public/engine/', import.meta.url));

async function copyCore(packageName, directory, files) {
  // Публичный entry пакета находится рядом с ESM-сборкой.
  const source = join(dirname(require.resolve(packageName)), '../esm');
  const target = join(root, directory);
  await mkdir(target, { recursive: true });
  await Promise.all(files.map((file) => copyFile(join(source, file), join(target, file))));
}

const ffmpegSource = dirname(require.resolve('@ffmpeg/ffmpeg/worker'));
const ffmpeg = join(root, 'ffmpeg');
const mp3 = join(root, 'mp3');
const docx = join(root, 'docx');
const docxSource = dirname(require.resolve('docx-preview'));
const requireFromDocx = createRequire(require.resolve('docx-preview'));
const jszipSource = dirname(requireFromDocx.resolve('jszip'));
const pdf = join(root, 'pdf');
const pdfSource = dirname(require.resolve('pdfjs-dist/package.json'));
await Promise.all([mp3, ffmpeg, docx, pdf].map((path) => mkdir(path, { recursive: true })));
const wrapperFiles = (await readdir(ffmpegSource)).filter((file) => file.endsWith('.js'));
await Promise.all([
  ...wrapperFiles.map((file) => copyFile(join(ffmpegSource, file), join(ffmpeg, file))),
  copyFile(join(dirname(require.resolve('lamejs/package.json')), 'LICENSE'), join(mp3, 'LICENSE')),
  copyFile(join(dirname(require.resolve('lamejs/package.json')), 'lame.min.js'), join(mp3, 'lame.min.js')),
  copyCore('@ffmpeg/core', 'video', ['ffmpeg-core.js', 'ffmpeg-core.wasm']),
  copyFile(join(docxSource, 'docx-preview.min.js'), join(docx, 'docx-preview.min.js')),
  copyFile(join(jszipSource, '../dist/jszip.min.js'), join(docx, 'jszip.min.js')),
  copyFile(join(pdfSource, 'build/pdf.worker.min.mjs'), join(pdf, 'pdf.worker.min.mjs')),
  copyFile(join(pdfSource, 'LICENSE'), join(pdf, 'LICENSE')),
  ...['cmaps', 'iccs', 'standard_fonts', 'wasm'].map((directory) =>
    cp(join(pdfSource, directory), join(pdf, directory), { recursive: true }),
  ),
]);
