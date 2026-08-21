import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * On-demand revalidation for a development's mini-site.
 *
 * The public pages are statically generated with a 60s revalidate, so a
 * developer who saved their branding and immediately opened their live page
 * saw the previous version and reasonably concluded the save had failed. This
 * lets the dashboard flush that cache the moment a save succeeds.
 *
 * Guarded by a shared secret rather than a user session: this is called from
 * the dashboard, but the same endpoint is useful from the API after an admin
 * edit, and neither should require a browser cookie. Without the secret set,
 * the route refuses every request rather than defaulting to open — an
 * unauthenticated cache-buster is a cheap way to hammer the origin.
 */

/** Every cached route that renders this development. */
function pathsFor(slug: string): string[] {
  return [
    `/${slug}`,
    `/${slug}/tour/cinematic`,
    `/${slug}/tour/3d`,
    `/${slug}/tour/vr`,
    // Unit pages carry the development's branding too, so a template change
    // has to reach them. `page` type revalidates the whole dynamic segment.
    `/${slug}/units/[unitId]`,
  ];
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    // Deliberately 503 rather than 500: this is a configuration gap, not a
    // fault in the request, and the caller should treat it as "not available"
    // rather than retrying.
    return NextResponse.json(
      { revalidated: false, message: 'Revalidation is not configured' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-revalidate-secret');
  if (provided !== secret) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }

  let slug: string | undefined;
  try {
    const body = (await request.json()) as { slug?: string };
    slug = body.slug;
  } catch {
    return NextResponse.json({ revalidated: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  // Slugs are used to build paths, so anything that could climb out of the
  // development's own namespace is rejected rather than sanitised.
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
    return NextResponse.json({ revalidated: false, message: 'Invalid slug' }, { status: 400 });
  }

  const paths = pathsFor(slug);
  for (const path of paths) {
    revalidatePath(path, path.includes('[') ? 'page' : undefined);
  }

  return NextResponse.json({ revalidated: true, paths, now: Date.now() });
}
