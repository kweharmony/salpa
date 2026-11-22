import assert from 'node:assert/strict';
import test from 'node:test';
import { BlobReader, ZipReader } from '@zip.js/zip.js';
import { ConverterService } from '../../src/lib/converters/index';
import { createArchive } from '../../src/lib/download-archive';
import { FILE_ACCEPT, SUPPORTED_FORMATS, detectFormat } from '../../src/lib/types';

test('file dialog and available outputs use the same format registry', () => {
  const accepted = FILE_ACCEPT.split(',');
  for (const format of SUPPORTED_FORMATS) {
    const file = new File(['fixture'], 'sample.' + format.extension.toUpperCase());
    assert.ok(accepted.includes('.' + format.extension));
    assert.equal(detectFormat(file)?.extension, format.extension);
    assert.deepEqual(ConverterService.getAvailableFormats(file), format.convertTo);
  }
});

test('WebM audio uses the audio converter and unsupported files are rejected', () => {
  const audio = new File(['fixture'], 'sample.webm', { type: 'audio/webm' });
  assert.equal(detectFormat(audio)?.category, 'audio');
  assert.deepEqual(ConverterService.getAvailableFormats(audio), ['mp3', 'wav']);
  assert.ok(ConverterService.validate(new File(['fixture'], 'sample.bin')).error);
  assert.ok(ConverterService.validate(new File([], 'empty.png')).error);
  assert.equal(ConverterService.validate(new File([], 'empty.csv')).error, undefined);
});

test('archives preserve each result and keep colliding names distinct', async () => {
  const blob = await createArchive([
    { name: 'Данные.csv', blob: new Blob(['a']) },
    { name: 'данные.CSV', blob: new Blob(['b']) },
    { name: '../report.csv', blob: new Blob(['c']) },
  ]);
  const reader = new ZipReader(new BlobReader(blob));
  try {
    const entries = await reader.getEntries();
    assert.deepEqual(entries.map((entry) => entry.filename).sort(),
      ['Данные.csv', 'данные (2).CSV', 'report.csv'].sort());
    assert.ok(entries.every(({ uncompressedSize }) => uncompressedSize === 1));
  } finally {
    await reader.close();
  }
});
