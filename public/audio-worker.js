function pcm16(sample) {
  const bounded = Math.max(-1, Math.min(1, sample));
  return bounded < 0 ? bounded * 0x8000 : bounded * 0x7fff;
}

function writeLabel(view, offset, label) {
  for (let index = 0; index < label.length; index++) {
    view.setUint8(offset + index, label.charCodeAt(index));
  }
}

function encodeWav(channels, sampleRate) {
  const channelCount = channels.length;
  const frames = channels[0].length;
  const blockAlign = channelCount * 2;
  const dataLength = frames * blockAlign;
  if (dataLength > 0xffffffff - 36) throw new Error('wavTooLong');

  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  writeLabel(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeLabel(view, 8, 'WAVE');
  writeLabel(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeLabel(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  for (let frame = 0; frame < frames; frame++) {
    if (frame % 65536 === 0) self.postMessage({ progress: frame / frames });
    for (let channel = 0; channel < channelCount; channel++) {
      view.setInt16(44 + frame * blockAlign + channel * 2, pcm16(channels[channel][frame]), true);
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function encodeMp3(channels, sampleRate, bitrate) {
  try {
    self.importScripts('/engine/mp3/lame.min.js');
  } catch {
    throw new Error('mp3Load');
  }
  const encoder = new self.lamejs.Mp3Encoder(channels.length, sampleRate, bitrate);
  const [left, right] = channels;
  const blockSize = 1152;
  const leftBlock = new Int16Array(blockSize);
  const rightBlock = new Int16Array(blockSize);
  const chunks = [];

  for (let offset = 0; offset < left.length; offset += blockSize) {
    const length = Math.min(blockSize, left.length - offset);
    for (let index = 0; index < length; index++) {
      leftBlock[index] = pcm16(left[offset + index]);
      if (right) rightBlock[index] = pcm16(right[offset + index]);
    }

    const leftSamples = leftBlock.subarray(0, length);
    const bytes = right
      ? encoder.encodeBuffer(leftSamples, rightBlock.subarray(0, length))
      : encoder.encodeBuffer(leftSamples);
    if (bytes.length) chunks.push(new Uint8Array(bytes));
    if (offset % (blockSize * 40) === 0) self.postMessage({ progress: offset / left.length });
  }
  const tail = encoder.flush();
  if (tail.length) chunks.push(new Uint8Array(tail));
  return new Blob(chunks, { type: 'audio/mpeg' });
}

self.onmessage = ({ data: { channels, sampleRate, format, bitrate } }) => {
  try {
    const blob = format === 'mp3'
      ? encodeMp3(channels, sampleRate, bitrate)
      : encodeWav(channels, sampleRate);
    self.postMessage({ blob });
  } catch (error) {
    const code = error instanceof Error && ['mp3Load', 'wavTooLong'].includes(error.message)
      ? error.message
      : 'audioEncode';
    self.postMessage({ error: code });
  }
};
