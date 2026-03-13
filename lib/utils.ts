/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

type GetAudioContextOptions = AudioContextOptions & {
  id?: string;
};

// A map to store and reuse AudioContext instances, acting as a singleton manager.
const map: Map<string, AudioContext> = new Map();

/**
 * A singleton-like getter for the AudioContext.
 * Browsers often require a user interaction (like a click) before an
 * AudioContext can be created or resumed. This utility handles that
 * complexity by waiting for an interaction if necessary. It also caches
 * and reuses contexts based on an ID to avoid creating multiple instances.
 */
export const audioContext: (
  options?: GetAudioContextOptions
) => Promise<AudioContext> = (() => {
  // A promise that resolves once the user has interacted with the page.
  const didInteract = new Promise(res => {
    window.addEventListener('pointerdown', res, { once: true });
    window.addEventListener('keydown', res, { once: true });
  });

  return async (options?: GetAudioContextOptions) => {
    try {
      // Attempt to play a silent audio clip to "unlock" the AudioContext.
      const a = new Audio();
      a.src =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      await a.play();

      // Check if a context with this ID already exists.
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx) return ctx;
      }
      // Create and cache a new context.
      const ctx = new AudioContext(options);
      if (options?.id) map.set(options.id, ctx);
      return ctx;
    } catch (e) {
      // If the initial attempt fails (e.g., due to autoplay restrictions),
      // wait for user interaction and then try again.
      await didInteract;
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx) return ctx;
      }
      const ctx = new AudioContext(options);
      if (options?.id) map.set(options.id, ctx);
      return ctx;
    }
  };
})();

/**
 * Encodes raw PCM16 audio data into a WAV-formatted Blob.
 * This is necessary for the browser's <audio> tag to correctly play and
 * determine the duration of raw audio chunks received from the API.
 * @param pcmData The raw PCM16 data as an ArrayBuffer.
 * @param sampleRate The sample rate of the audio (default 24000).
 * @returns A Blob containing the WAV-encoded audio.
 */
export function pcmToWav(pcmData: ArrayBuffer, sampleRate: number = 24000): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.byteLength;
  const chunkSize = 36 + dataSize;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, chunkSize, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, byteRate, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, dataSize, true);

  return new Blob([header, pcmData], { type: 'audio/wav' });
}

/**
 * Combines multiple ArrayBuffers into a single ArrayBuffer.
 * @param chunks An array of ArrayBuffers to combine.
 * @returns A single ArrayBuffer containing all the data.
 */
export function combineArrayBuffers(chunks: ArrayBuffer[]): ArrayBuffer {
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}

/**
 * Decodes a base64 string into an ArrayBuffer.
 * This is a necessary utility for handling audio data, which is often
 * transmitted as base64.
 * @param base64 The base64-encoded string.
 * @returns The decoded ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}