import { XML_HEADERS, indexXml } from '../../lib/seo/sitemaps';

/** The sitemap index robots.txt points at: one typed sitemap per kind of page. */
export const revalidate = 3600;

export async function GET() {
  return new Response(await indexXml(), { headers: XML_HEADERS });
}
