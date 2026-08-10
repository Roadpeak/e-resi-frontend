import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://e-resi.com';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.e-resi.com/api';

/** Marketing and marketplace routes that always exist. */
const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1, changeFrequency: 'daily' },
  { path: '/properties', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/rent', priority: 0.9, changeFrequency: 'hourly' },
  // Property-type landing pages — each targets its own search intent
  // ("buy villas in Kenya", "rent commercial property in Kenya").
  { path: '/apartments', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/villas', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/commercial', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/rent/apartments', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/rent/villas', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/rent/commercial', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/developers', priority: 0.8, changeFrequency: 'daily' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/for-developers', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/for-investors', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/pricing', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/careers', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
];

/**
 * Page through a listing endpoint. The API caps `limit` at 100, so asking for
 * more returns a validation error rather than more rows — which would leave
 * every property silently missing from the sitemap.
 */
async function fetchAll(
  endpoint: string,
): Promise<{ slug: string; updatedAt?: string }[]> {
  const out: { slug: string; updatedAt?: string }[] = [];
  const LIMIT = 100;
  const MAX_PAGES = 20; // 2,000 entries is well past anything we need today

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const res = await fetch(`${API}/${endpoint}?limit=${LIMIT}&page=${page}`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const json = await res.json();
      const items: { slug: string; updatedAt?: string }[] = json.data?.data ?? json.data ?? [];
      out.push(...items);
      if (items.length < LIMIT) break;
    } catch {
      // A sitemap must never break the build; stop and return what we have.
      break;
    }
  }

  return out;
}

async function dynamicEntries(): Promise<MetadataRoute.Sitemap> {
  const [properties, rentals] = await Promise.all([
    fetchAll('properties'),
    fetchAll('rent-listings'),
  ]);

  return [
    ...properties.map((p) => ({
      url: `${BASE}/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...rentals.map((l) => ({
      url: `${BASE}/rent/${l.slug}`,
      lastModified: l.updatedAt ? new Date(l.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  return [
    ...STATIC.map((s) => ({
      url: `${BASE}${s.path}`,
      lastModified: now,
      changeFrequency: s.changeFrequency,
      priority: s.priority,
    })),
    ...(await dynamicEntries()),
  ];
}
