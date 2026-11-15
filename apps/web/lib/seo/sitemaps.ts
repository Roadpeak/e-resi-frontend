import { MIN_INDEXABLE, fetchAreas } from './areas';
import { GUIDES } from '../guides';
import { REELS_MIN_INDEXABLE, publishedReelCount } from './reels';

/**
 * The sitemap index and its typed sitemaps.
 *
 * Every listing and profile carries its record's real last-updated date,
 * so Google recrawls what changed. Static pages carry none rather than a
 * made-up "now". Priority and change frequency are omitted: Google ignores
 * both. Only public, indexable pages are listed.
 */

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://e-resi.com';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.e-resi.com/api';

export type Entry = { loc: string; lastmod?: string };
export const SITEMAP_TYPES = ['pages', 'developments', 'rentals', 'agents', 'developers', 'areas'] as const;
export type SitemapType = (typeof SITEMAP_TYPES)[number];

const STATIC_PATHS = [
  '', '/properties', '/apartments', '/villas', '/commercial',
  '/rent', '/rent/apartments', '/rent/villas', '/rent/commercial',
  '/developers', '/agents', '/neighbourhoods', '/map/locations',
  '/for-developers', '/for-agents', '/for-investors', '/list-agency', '/list-development', '/services',
  '/about', '/pricing', '/faq', '/contact', '/careers', '/guides',
  ...GUIDES.map((g) => `/guides/${g.slug}`),
  '/privacy', '/terms',
];

type Row = { id?: string; slug?: string; updatedAt?: string };

/** Page through a public list endpoint (the API caps limit at 100). */
async function fetchAll(endpoint: string): Promise<Row[]> {
  const out: Row[] = [];
  const LIMIT = 100;
  for (let page = 1; page <= 50; page++) {
    try {
      const res = await fetch(`${API}/${endpoint}?limit=${LIMIT}&page=${page}`, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const json = await res.json();
      const items: Row[] = json.data?.data ?? json.data ?? [];
      if (!Array.isArray(items)) break;
      out.push(...items);
      if (items.length < LIMIT) break;
    } catch {
      break; // a sitemap must never fail the request; return what we have
    }
  }
  return out;
}

const iso = (d?: string) => (d && !Number.isNaN(Date.parse(d)) ? new Date(d).toISOString() : undefined);

export async function entriesFor(type: SitemapType): Promise<Entry[]> {
  switch (type) {
    case 'pages': {
      // /reels joins once it passes the same threshold its robots tag uses.
      const reels = (await publishedReelCount()) >= REELS_MIN_INDEXABLE ? ['/reels'] : [];
      return [...STATIC_PATHS, ...reels].map((p) => ({ loc: `${SITE}${p}` }));
    }
    case 'developments':
      return (await fetchAll('properties')).filter((r) => r.slug).map((r) => ({ loc: `${SITE}/${r.slug}`, lastmod: iso(r.updatedAt) }));
    case 'rentals':
      return (await fetchAll('rent-listings')).filter((r) => r.slug).map((r) => ({ loc: `${SITE}/rent/${r.slug}`, lastmod: iso(r.updatedAt) }));
    case 'agents':
      // The public list holds only approved, listed agents.
      return (await fetchAll('agents')).filter((r) => r.id).map((r) => ({ loc: `${SITE}/agents/${r.id}`, lastmod: iso(r.updatedAt) }));
    case 'developers':
      return (await fetchAll('users/developers')).filter((r) => r.id).map((r) => ({ loc: `${SITE}/developers/${r.id}`, lastmod: iso(r.updatedAt) }));
    case 'areas': {
      const areas = await fetchAreas();
      return areas.flatMap((a) => [
        { loc: `${SITE}/neighbourhoods/${a.slug}`, lastmod: iso(a.updatedAt) },
        // Area listing pages only above the threshold their own robots tag uses.
        ...(a.propertyCount >= MIN_INDEXABLE ? [{ loc: `${SITE}/properties/in/${a.slug}` }] : []),
        ...(a.rentCount >= MIN_INDEXABLE ? [{ loc: `${SITE}/rent/in/${a.slug}` }] : []),
      ]);
    }
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function urlsetXml(entries: Entry[]): string {
  const body = entries.map((e) => `<url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/** The index: each typed sitemap, dated by its newest entry when it has dates. */
export async function indexXml(): Promise<string> {
  const parts = await Promise.all(SITEMAP_TYPES.map(async (t) => {
    const entries = await entriesFor(t);
    const newest = entries.map((e) => e.lastmod).filter(Boolean).sort().pop();
    return { t, newest, empty: entries.length === 0 };
  }));
  const body = parts.filter((p) => !p.empty)
    .map((p) => `<sitemap><loc>${SITE}/sitemaps/${p.t}.xml</loc>${p.newest ? `<lastmod>${p.newest}</lastmod>` : ''}</sitemap>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export const XML_HEADERS = { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600, s-maxage=3600' };
