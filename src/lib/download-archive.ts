interface ArchiveEntry {
  name: string;
  blob: Blob;
}

export async function createArchive(entries: Iterable<ArchiveEntry> | AsyncIterable<ArchiveEntry>): Promise<Blob> {
  const { BlobReader, BlobWriter, ZipWriter } = await import('@zip.js/zip.js');
  const archive = new ZipWriter(new BlobWriter('application/zip'), { useWebWorkers: false });
  const usedNames = new Set<string>();

  for await (const { name, blob } of entries) {
    const sanitized = name.split(/[\\/]/).pop()?.replace(/[:*?"<>|\u0000-\u001f]/g, '_')
      .replace(/[. ]+$/, '') || 'salpa';
    const nameParts = /^(.*?)(\.[^.]+)?$/.exec(sanitized);
    const stem = (nameParts?.[1] || 'salpa').replace(
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, '_$1',
    );
    const extension = nameParts?.[2] ?? '';
    let candidate = stem + extension;
    let index = 2;
    while (usedNames.has(candidate.normalize('NFC').toLowerCase())) {
      candidate = `${stem} (${index++})${extension}`;
    }
    usedNames.add(candidate.normalize('NFC').toLowerCase());
    await archive.add(candidate, new BlobReader(blob), { level: 0 });
  }

  return archive.close();
}
