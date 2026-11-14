import { SITEMAP_TYPES, XML_HEADERS, entriesFor, urlsetXml, type SitemapType } from '../../../lib/seo/sitemaps';

/** /sitemaps/<type>.xml — developments, rentals, agents, developers, areas, pages. */
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const type = file.replace(/\.xml$/, '') as SitemapType;
  if (!file.endsWith('.xml') || !SITEMAP_TYPES.includes(type)) return new Response('Not found', { status: 404 });
  return new Response(urlsetXml(await entriesFor(type)), { headers: XML_HEADERS });
}

export function generateStaticParams() {
  return SITEMAP_TYPES.map((t) => ({ file: `${t}.xml` }));
}
