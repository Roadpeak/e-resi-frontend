'use client';

/**
 * Cut a 45-second window out of a video in the browser, before upload, so
 * only the reel itself is sent and stored.
 *
 * Uses ffmpeg compiled to WebAssembly. The small wrapper is self-hosted in
 * /public/ffmpeg (from @ffmpeg/ffmpeg 0.12.15); the ~31 MB core loads once
 * from jsDelivr, pinned to the version that wrapper expects, then the
 * browser caches it.
 *
 * The cut copies the existing streams instead of re-encoding (`-c copy`):
 * full quality and a few seconds of work even on a phone. The trade-off is
 * that the clip starts on the keyframe at or just before the chosen point,
 * up to a second or two early. Returns null whenever trimming is not
 * possible, so the caller can fall back to uploading the whole file.
 */

const CORE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/esm';

/** Loose shape of the bits of the FFmpeg class used here. */
interface FFmpegLike {
  loaded: boolean;
  load(o: { coreURL: string; wasmURL: string }): Promise<boolean>;
  writeFile(path: string, data: Uint8Array): Promise<boolean>;
  readFile(path: string): Promise<Uint8Array | string>;
  deleteFile(path: string): Promise<boolean>;
  exec(args: string[], timeout?: number): Promise<number>;
  on(event: 'progress', cb: (e: { progress: number }) => void): void;
  off(event: 'progress', cb: (e: { progress: number }) => void): void;
  terminate(): void;
}

let instance: Promise<FFmpegLike> | null = null;

async function blobUrl(url: string, type: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return URL.createObjectURL(new Blob([await res.arrayBuffer()], { type }));
}

function load(): Promise<FFmpegLike> {
  if (!instance) {
    instance = (async () => {
      // A runtime URL import: the wrapper is served as-is from /public, not bundled.
      const path = '/ffmpeg/index.js';
      const mod = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ path)) as { FFmpeg: new () => FFmpegLike };
      const ff = new mod.FFmpeg();
      await ff.load({
        coreURL: await blobUrl(`${CORE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await blobUrl(`${CORE}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      return ff;
    })().catch((e) => { instance = null; throw e; });
  }
  return instance;
}

/** Phones run out of memory on very large files; desktops cope with more. */
function maxBytes() {
  const mobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  return (mobile ? 400 : 900) * 1024 * 1024;
}

export async function trimVideo(
  file: File,
  startSec: number,
  durationSec = 45,
  onStage?: (stage: 'loading' | 'trimming') => void,
): Promise<File | null> {
  if (typeof window === 'undefined' || typeof WebAssembly === 'undefined') return null;
  if (file.size > maxBytes()) return null;
  const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] ?? (file.type.includes('webm') ? 'webm' : file.type.includes('quicktime') ? 'mov' : 'mp4')).toLowerCase();
  const input = `in.${ext}`;
  const output = `out.${ext}`;
  try {
    onStage?.('loading');
    const ff = await load();
    onStage?.('trimming');
    await ff.writeFile(input, new Uint8Array(await file.arrayBuffer()));
    const code = await ff.exec([
      '-ss', startSec.toFixed(2), '-i', input, '-t', String(durationSec),
      '-c', 'copy', '-avoid_negative_ts', 'make_zero',
      ...(ext === 'mp4' || ext === 'mov' || ext === 'm4v' ? ['-movflags', '+faststart'] : []),
      output,
    ], 120_000);
    const data = code === 0 ? await ff.readFile(output) : null;
    await ff.deleteFile(input).catch(() => undefined);
    await ff.deleteFile(output).catch(() => undefined);
    if (!data || typeof data === 'string' || data.byteLength < 1024) return null;
    const name = file.name.replace(/(\.[a-z0-9]+)?$/i, `-reel.${ext}`);
    return new File([data as BlobPart], name, { type: file.type || 'video/mp4' });
  } catch {
    return null;
  }
}

/**
 * A JPEG still from the video at the given second, for the reel's thumbnail.
 * Videos are stored where poster frames can't be generated on the fly, so the
 * browser makes one while it has the file open.
 */
export async function captureFrame(src: string, atSec: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.src = src;
    const done = (b: Blob | null) => { v.removeAttribute('src'); v.load(); resolve(b); };
    const timer = window.setTimeout(() => done(null), 15_000);
    v.onloadedmetadata = () => { v.currentTime = Math.min(Math.max(0, atSec), Math.max(0, v.duration - 0.1)); };
    v.onseeked = () => {
      try {
        const w = v.videoWidth;
        const h = v.videoHeight;
        const scale = Math.min(1, 720 / Math.max(w, h));
        const c = document.createElement('canvas');
        c.width = Math.round(w * scale);
        c.height = Math.round(h * scale);
        c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
        c.toBlob((b) => { window.clearTimeout(timer); done(b); }, 'image/jpeg', 0.82);
      } catch {
        window.clearTimeout(timer);
        done(null);
      }
    };
    v.onerror = () => { window.clearTimeout(timer); done(null); };
  });
}
