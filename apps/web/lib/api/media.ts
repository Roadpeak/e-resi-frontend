import { useAuthStore } from '../stores/auth.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export interface UploadedFile {
  url: string;
  key: string;
  sizeBytes: number;
}

/** Upload a file (multipart) to the media endpoint — returns its public URL. */
export type UploadFolder = 'properties' | 'rentals' | 'avatars' | 'logos' | 'documents' | 'tours';

export async function uploadFile(
  file: File,
  folder: UploadFolder = 'properties',
): Promise<UploadedFile> {
  const token = useAuthStore.getState().accessToken;
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  const res = await fetch(`${BASE_URL}/media/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error ?? 'Upload failed');
  }
  return (json?.data ?? json) as UploadedFile;
}
