/** Structured data for search engines, rendered into the server HTML. */
export function JsonLd({ data }: { data: unknown }) {
  // `<` escaped so a listing name can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://e-resi.com';
export const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.e-resi.com/api';

/** A Google-readable list of the listings on a browse page. */
export function itemList(name: string, items: { url: string; name: string; image?: string | null }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}${it.url}`,
      name: it.name,
      ...(it.image ? { image: it.image } : {}),
    })),
  };
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem', position: i + 1, name: t.name, item: `${SITE_URL}${t.path}`,
    })),
  };
}
