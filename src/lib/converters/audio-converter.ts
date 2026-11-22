import { LocalizedError, isMessageKey, type MessageKey } from '../i18n';

export type AudioFormat = 'mp3' | 'wav';

interface AudioConversionOptions {
  format: AudioFormat;
  bitrate?: number;
}

type AudioWorkerResponse =
  | { progress: number }
  | { blob: Blob }
  | { error: string };

export class AudioConverter {
  static async convert(
    file: File,
    options: AudioConversionOptions,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<Blob> {
    signal?.throwIfAborted();
    onProgress?.(5);

    const context = new AudioContext();
    let audio: AudioBuffer;
    try {
      const input = await file.arrayBuffer();
      signal?.throwIfAborted();
      onProgress?.(15);
      audio = await context.decodeAudioData(input);
    } catch {
      signal?.throwIfAborted();
      throw new LocalizedError('audioDecode');
    } finally {
      await context.close().catch(() => undefined);
    }

    signal?.throwIfAborted();
    onProgress?.(30);
    return this.encode(audio, options, onProgress, signal);
  }

  private static encode(
    audio: AudioBuffer,
    { format, bitrate = 192 }: AudioConversionOptions,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<Blob> {
    const count = format === 'mp3' ? Math.min(audio.numberOfChannels, 2) : audio.numberOfChannels;
    const channels = Array.from({ length: count }, (_, index) =>
      new Float32Array(audio.getChannelData(index)),
    );
    return new Promise((resolve, reject) => {
      const worker = new Worker('/audio-worker.js');

      function cleanup() {
        worker.terminate();
        signal?.removeEventListener('abort', onAbort);
      }

      function onAbort() {
        cleanup();
        reject(signal?.reason);
      }

      function onError(key: MessageKey) {
        cleanup();
        reject(new LocalizedError(key));
      }

      signal?.addEventListener('abort', onAbort, { once: true });
      worker.onerror = () => onError('audioStart');
      worker.onmessage = ({ data }: MessageEvent<AudioWorkerResponse>) => {
        if ('progress' in data) {
          onProgress?.(30 + data.progress * 69);
        } else if ('error' in data) {
          onError(isMessageKey(data.error) ? data.error : 'audioEncode');
        } else {
          cleanup();
          onProgress?.(100);
          resolve(data.blob);
        }
      };

      try {
        worker.postMessage({ format, bitrate, sampleRate: audio.sampleRate, channels },
          channels.map((channel) => channel.buffer));
      } catch {
        onError('audioTransfer');
      }
    });
  }
}
