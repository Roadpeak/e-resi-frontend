import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://e-resi.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private surfaces and anything behind auth — no value in an index,
      // and the admin console should not be discoverable at all.
      disallow: ['/admin', '/dashboard', '/account', '/onboarding', '/login', '/register', '/api/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
