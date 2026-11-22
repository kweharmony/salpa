export function getMediaDuration(
  file: File,
  kind: 'audio' | 'video',
  signal: AbortSignal,
): Promise<number | null> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const media = document.createElement(kind);
    const url = URL.createObjectURL(file);
    const timeout = setTimeout(() => finish(null), 3000);

    function finish(duration: number | null) {
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      media.onloadedmetadata = null;
      media.onerror = null;
      media.removeAttribute('src');
      media.load();
      URL.revokeObjectURL(url);
      if (signal.aborted) reject(signal.reason);
      else resolve(duration);
    }

    function onAbort() {
      finish(null);
    }

    signal.addEventListener('abort', onAbort, { once: true });
    media.preload = 'metadata';
    media.onloadedmetadata = () => finish(Number.isFinite(media.duration) ? media.duration : null);
    media.onerror = () => finish(null);
    media.src = url;
  });
}
