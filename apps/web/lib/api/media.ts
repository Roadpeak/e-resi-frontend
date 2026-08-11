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

interface PresignResponse {
  uploadUrl: string;
  key: string;
  fileUrl: string;
  fields: Record<string, string | number> | null;
  resourceType: 'image' | 'video' | 'raw';
  direct: boolean;
}

/**
 * Upload a file, reporting progress and returning its public URL.
 *
 * Goes straight to Cloudinary where possible: the API buffers an entire
 * upload in memory, so routing a multi-gigabyte video through it would
 * exhaust the container long before the file finished. Uploading direct also
 * means the bytes never consume our bandwidth twice.
 *
 * Falls back to the API when Cloudinary is unconfigured (local sandbox) or
 * when signing fails, so nothing breaks in development or if the presign
 * endpoint is unavailable.
 */
export async function uploadFile(
  file: File,
  folder: UploadFolder = 'properties',
  options: UploadOptions = {},
): Promise<UploadedFile> {
  const presigned = await presign(file, folder);
  if (presigned?.direct && presigned.fields) {
    return uploadDirectToCloudinary(file, presigned, options);
  }
  return uploadViaApi(file, folder, options);
}

/** Ask the API to sign a direct upload. Returns null on any failure. */
async function presign(file: File, folder: UploadFolder): Promise<PresignResponse | null> {
  const token = useAuthStore.getState().accessToken;
  try {
    const res = await fetch(`${BASE_URL}/media/presign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        fileName: file.name,
        // Browsers occasionally report an empty type; the API validates
        // against an allowlist, so send something it will recognise.
        mimeType: file.type || 'application/octet-stream',
        folder,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as PresignResponse;
  } catch {
    // A failed presign is not fatal — the API path still works.
    return null;
  }
}

/**
 * POST straight to Cloudinary with the signed fields.
 *
 * Cloudinary's own endpoint handles large files without us holding them, so
 * this is the path that makes multi-gigabyte uploads possible at all.
 */
function uploadDirectToCloudinary(
  file: File,
  presigned: PresignResponse,
  options: UploadOptions,
): Promise<UploadedFile> {
  return new Promise<UploadedFile>((resolve, reject) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(presigned.fields!)) {
      form.append(k, String(v));
    }
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', presigned.uploadUrl);
    // Deliberately no Authorization header: this request goes to Cloudinary,
    // and sending our bearer token to a third party would leak it.

    attachProgress(xhr, options);

    xhr.addEventListener('load', () => {
      let json: { secure_url?: string; public_id?: string; bytes?: number; error?: { message?: string } } | null = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        json = null;
      }
      if (xhr.status >= 200 && xhr.status < 300 && json?.secure_url) {
        resolve({
          url: json.secure_url,
          key: `${presigned.resourceType}:${json.public_id ?? presigned.key}`,
          sizeBytes: json.bytes ?? file.size,
        });
      } else {
        reject(new Error(json?.error?.message ?? `Upload failed (${xhr.status})`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed — check your connection')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
    xhr.addEventListener('timeout', () => reject(new Error('Upload timed out')));

    xhr.send(form);
  });
}

/** Shared progress/abort wiring for both upload paths. */
function attachProgress(xhr: XMLHttpRequest, options: UploadOptions) {
  if (options.onProgress) {
    xhr.upload.addEventListener('progress', (e) => {
      options.onProgress!({
        loaded: e.loaded,
        // lengthComputable is false for bodies the browser cannot size;
        // reporting a percentage from a guessed total would be worse than
        // reporting none.
        total: e.lengthComputable ? e.total : 0,
        percent: e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : 0,
      });
    });
  }
  if (options.signal) {
    if (options.signal.aborted) {
      xhr.abort();
      return;
    }
    options.signal.addEventListener('abort', () => xhr.abort(), { once: true });
  }
}

/**
 * Upload through our own API. Used in the local sandbox, and as the fallback
 * when a direct upload cannot be signed.
 *
 * Uses XMLHttpRequest rather than fetch: fetch exposes no upload-progress
 * event, and streaming request bodies are not supported widely enough to rely
 * on. A spinner with no numbers is indistinguishable from a hung upload —
 * people give up or retry, which makes it worse.
 */
function uploadViaApi(
  file: File,
  folder: UploadFolder,
  options: UploadOptions,
): Promise<UploadedFile> {
  const token = useAuthStore.getState().accessToken;

  return new Promise<UploadedFile>((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/media/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    attachProgress(xhr, options);

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
