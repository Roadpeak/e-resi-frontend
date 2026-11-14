import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://e-resi.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private surfaces and anything behind auth — no value in an index,
      // and the admin console should not be discoverable at all.
      // '/agent$' and '/agent/' block only the signed-in agent portal. A bare
      // '/agent' would also match /agents and every public agent profile.
      // Invitation pages stay crawlable on purpose: their noindex has to be readable.
      disallow: ['/admin', '/dashboard', '/account', '/agent$', '/agent/', '/onboarding', '/login', '/register', '/api/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
