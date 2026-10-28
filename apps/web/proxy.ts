import { NextResponse, type NextRequest } from 'next/server';

/**
 * Custom domains — a development served on its own host, e.g.
 * herisresidence.co.ke, as a standalone site.
 *
 * Requests for e-resi's own hosts pass straight through. Any other host is
 * looked up against the API; a registered one is mapped onto that
 * development's pages with clean URLs, so herisresidence.co.ke/tour/vr serves
 * /<slug>/tour/vr. Old /<slug>/… links redirect to the clean form. Anything
 * that is not part of the development's site (login, marketplace, dashboard)
 * goes back to e-resi.com, and an unregistered host gets a plain 404.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://e-resi.com';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const SITE_HOST = new URL(SITE_URL).hostname;

/** Sections of a development's site that live under /<slug>/. */
const SITE_SECTIONS = ['/tour', '/units', '/opengraph-image'];

function isOwnHost(host: string) {
  return host === SITE_HOST || host.endsWith(`.${SITE_HOST}`)
    || host === 'e-resi.com' || host.endsWith('.e-resi.com')
    || host === 'localhost' || host.endsWith('.localhost')
    || /^\d+(\.\d+){3}$/.test(host) || host.startsWith('[');
}

// Per-process cache: every page load also fetches scripts, images and RSC
// payloads, and each would otherwise cost an API round trip.
const cache = new Map<string, { slug: string | null; at: number }>();
const HIT_TTL = 60_000;
const MISS_TTL = 30_000;

async function slugFor(host: string): Promise<string | null> {
  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < (hit.slug ? HIT_TTL : MISS_TTL)) return hit.slug;
  let slug: string | null = null;
  try {
    const res = await fetch(`${API_BASE}/properties/domain/${encodeURIComponent(host)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const body = await res.json();
      slug = body?.data?.slug ?? body?.slug ?? null;
    } else if (res.status !== 404 && hit) {
      // API trouble: keep serving the last known answer rather than taking
      // a live site down.
      return hit.slug;
    }
  } catch {
    if (hit) return hit.slug;
  }
  if (cache.size > 2000) cache.clear();
  cache.set(host, { slug, at: Date.now() });
  return slug;
}

export async function proxy(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').toLowerCase().replace(/:\d+$/, '');
  if (!host || isOwnHost(host)) return NextResponse.next();

  const slug = await slugFor(host.replace(/^www\./, ''));
  if (!slug) {
    return new NextResponse('Not found', { status: 404, headers: { 'content-type': 'text/plain' } });
  }

  const { pathname, search } = req.nextUrl;

  // Framework assets and public files are host-independent.
  if (pathname.startsWith('/_next/') || pathname.startsWith('/api/') || /\.[a-z0-9]+$/i.test(pathname)) {
    return NextResponse.next();
  }

  // Old-style /<slug>/… links (the templates build these) → clean URL.
  if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) {
    const rest = pathname.slice(slug.length + 1) || '/';
    if (rest.startsWith('/preview')) return NextResponse.redirect(new URL(`${pathname}${search}`, SITE_URL));
    // Built from the Host header: behind nginx, nextUrl carries the internal
    // upstream address, which a visitor's browser cannot reach.
    const proto = req.headers.get('x-forwarded-proto') ?? 'https';
    return NextResponse.redirect(`${proto}://${host}${rest}${search}`, 308);
  }

  if (pathname === '/' || SITE_SECTIONS.some((s) => pathname === s || pathname.startsWith(`${s}/`))) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === '/' ? `/${slug}` : `/${slug}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Everything else belongs to e-resi itself.
  return NextResponse.redirect(new URL(`${pathname}${search}`, SITE_URL));
}

export const config = {
  // Static files are matched too: an unregistered host must 404 on them as
  // well, not serve e-resi's assets under someone else's name.
  matcher: ['/((?!_next/static|_next/image).*)'],
};
