import { useAuthStore } from '../stores/auth.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export interface UploadedFile {
  url: string;
  key: string;
  sizeBytes: number;
}

/** Upload a file (multipart) to the media endpoint — returns its public URL. */
export type UploadFolder = 'properties' | 'rentals' | 'avatars' | 'logos' | 'documents' | 'tours';

/**
 * Upload the signed-in user's profile photo.
 * Separate from uploadFile(): /media/upload is developer-only, so tenants and
 * investors must go through the avatar-scoped endpoint.
 */
export async function uploadAvatar(file: File): Promise<UploadedFile> {
  const token = useAuthStore.getState().accessToken;
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${BASE_URL}/media/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? 'Upload failed');
  return (json?.data ?? json) as UploadedFile;
}

export interface UploadProgress {
  /** Bytes sent so far. */
  loaded: number;
  /** Total bytes, when the browser can determine it. */
  total: number;
  /** 0–100. Stays at 0 while the length is unknown. */
  percent: number;
}

export interface UploadOptions {
  /** Called as bytes go out — roughly every chunk, not on a timer. */
  onProgress?: (progress: UploadProgress) => void;
  /** Abort the upload; the promise rejects with "Upload cancelled". */
  signal?: AbortSignal;
}

/**
 * Upload a file, optionally reporting progress.
 *
 * Uses XMLHttpRequest rather than fetch: fetch exposes no upload-progress
 * event, and streaming request bodies are not supported widely enough to rely
 * on. Tour videos run to hundreds of megabytes, so a spinner with no numbers
 * is indistinguishable from a hung upload — people give up or retry, which
 * makes it worse.
 */
export function uploadFile(
  file: File,
  folder: UploadFolder = 'properties',
  options: UploadOptions = {},
): Promise<UploadedFile> {
  const token = useAuthStore.getState().accessToken;

  return new Promise<UploadedFile>((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/media/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (options.onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        options.onProgress!({
          loaded: e.loaded,
          // lengthComputable is false for streams the browser cannot size;
          // reporting a percentage from a guessed total would be worse than
          // reporting none.
          total: e.lengthComputable ? e.total : 0,
          percent: e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : 0,
        });
      });
    }

    if (options.signal) {
      if (options.signal.aborted) {
        reject(new Error('Upload cancelled'));
        return;
      }
      options.signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.addEventListener('load', () => {
      let json: { data?: UploadedFile; error?: string } | null = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        json = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((json?.data ?? json) as UploadedFile);
      } else {
        reject(new Error(json?.error ?? `Upload failed (${xhr.status})`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed — check your connection')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
    // A large video over a weak connection can legitimately take a long time,
    // so the transfer itself is not timed out here; the user can cancel.
    xhr.addEventListener('timeout', () => reject(new Error('Upload timed out')));

    xhr.send(form);
  });
}
