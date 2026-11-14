import type { Metadata } from 'next';

/**
 * Crawlable pagination for the browse pages: page N lives at `?page=N`,
 * page 1 at the clean URL, and each page canonicalises to itself.
 */

type SearchParams = Record<string, string | string[] | undefined> | undefined;

/** The requested page, or null when `?page=` is not a positive whole number (the route 404s). */
export function pageFrom(sp: SearchParams): number | null {
  const raw = sp?.page;
  if (raw === undefined) return 1;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!/^\d{1,4}$/.test(v)) return null;
  const n = Number(v);
  return n >= 1 ? n : null;
}

export function pageHref(path: string, page: number): string {
  return page <= 1 ? path : `${path}?page=${page}`;
}

/** The route's own metadata, with "Page N" in the title and a self-canonical for N > 1. */
export function pagedMetadata(base: Metadata, path: string, page: number): Metadata {
  if (page <= 1) return { ...base, alternates: { ...base.alternates, canonical: path } };
  const t = typeof base.title === 'string' ? base.title : undefined;
  const href = pageHref(path, page);
  return {
    ...base,
    ...(t ? { title: `${t} — Page ${page}` } : {}),
    alternates: { ...base.alternates, canonical: href },
    ...(base.openGraph ? { openGraph: { ...base.openGraph, url: href } } : {}),
  };
}
