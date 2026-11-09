import type { Metadata } from 'next';
import { PUBLIC_API } from '../../components/seo/JsonLd';
import type { Neighborhood } from '../api/neighborhoods';

/**
 * Area landing pages (/rent/in/<area>, /properties/in/<area>).
 *
 * An area page with one or two listings is thin content: it competes with
 * the listing pages themselves and drags down how the site is rated. So a
 * page only asks to be indexed (and only enters the sitemap) once its area
 * has at least this many listings; below that it still works for visitors
 * and passes link value on with noindex, follow.
 */
export const MIN_INDEXABLE = 3;

export type Area = Neighborhood & { rentCount: number };

const unwrap = (json: { success?: boolean; data?: unknown }) =>
  json && typeof json === 'object' && 'success' in json && 'data' in json ? json.data : json;

export async function fetchAreas(): Promise<Area[]> {
  try {
    const res = await fetch(`${PUBLIC_API}/neighborhoods`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const d = unwrap(await res.json());
    return Array.isArray(d) ? (d as Area[]).map((a) => ({ ...a, rentCount: a.rentCount ?? 0 })) : [];
  } catch {
    return [];
  }
}

export async function fetchArea(slug: string): Promise<Area | null> {
  try {
    const res = await fetch(`${PUBLIC_API}/neighborhoods/${encodeURIComponent(slug)}`, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const a = unwrap(await res.json()) as Area;
    return a ? { ...a, rentCount: a.rentCount ?? 0 } : null;
  } catch {
    return null;
  }
}

/** Index or not, by how many listings the page actually shows. */
export function areaRobots(count: number): Metadata['robots'] {
  return count >= MIN_INDEXABLE ? { index: true, follow: true } : { index: false, follow: true };
}

/** "KES 45,000" — whole shillings, no decimals. */
export const money = (v: number, currency = 'KES') => `${currency} ${Math.round(v).toLocaleString('en-KE')}`;

/** "1 and 2 bedroom", "studio to 3 bedroom" — from the bedroom counts on offer. */
export function bedroomPhrase(beds: number[]): string | null {
  const b = [...new Set(beds.filter((n) => Number.isFinite(n) && n >= 0))].sort((x, y) => x - y);
  if (!b.length) return null;
  const word = (n: number) => (n === 0 ? 'studio' : `${n}`);
  if (b.length === 1) return b[0] === 0 ? 'studios' : `${b[0]} bedroom`;
  if (b.length === 2) return `${word(b[0])} and ${b[1]} bedroom`;
  return `${word(b[0])} to ${b[b.length - 1]} bedroom`;
}

/** The place, as structured data for the area page. */
export function placeSchema(a: Area, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${a.name}, ${a.city}`,
    url,
    ...(a.description ? { description: a.description } : {}),
    ...(a.heroImageUrl ? { image: a.heroImageUrl } : {}),
    address: { '@type': 'PostalAddress', addressLocality: a.name, addressRegion: a.city, addressCountry: 'KE' },
    ...(a.latitude && a.longitude ? { geo: { '@type': 'GeoCoordinates', latitude: a.latitude, longitude: a.longitude } } : {}),
  };
}
