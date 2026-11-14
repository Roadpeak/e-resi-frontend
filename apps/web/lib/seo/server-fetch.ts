/**
 * Server-side reads of the public API for pages that must render their
 * content (and the right status code) before any JavaScript runs.
 *
 * Distinguishes "this record does not exist" from "the API is having a
 * moment": only the first should become a 404, so a brief outage never
 * tells Google a real page is gone.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.e-resi.com/api';

export type Fetched<T> = { status: 'ok'; data: T } | { status: 'missing' } | { status: 'error' };

export async function apiGet<T>(path: string, revalidate = 120): Promise<Fetched<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
    if (res.status === 404 || res.status === 410 || res.status === 400) return { status: 'missing' };
    if (!res.ok) return { status: 'error' };
    const json = await res.json();
    const data = (json && typeof json === 'object' && 'success' in json && 'data' in json ? json.data : json) as T;
    return { status: 'ok', data };
  } catch {
    return { status: 'error' };
  }
}

/** Plain text for meta descriptions: no line breaks, cut on a word boundary. */
export function snippet(text: string | null | undefined, max = 158): string | undefined {
  if (!text) return undefined;
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, flat.lastIndexOf(' ', max - 1) > 80 ? flat.lastIndexOf(' ', max - 1) : max - 1)}…`;
}
