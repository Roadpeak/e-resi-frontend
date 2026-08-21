'use server';

import { revalidatePath } from 'next/cache';

/**
 * Flush the cached mini-site for one development.
 *
 * A server action rather than a fetch to /api/revalidate from the browser:
 * the shared secret must never reach the client, and an action runs on the
 * server with no secret in flight at all. The route handler still exists for
 * callers outside this app — the API after an admin edit, for instance.
 *
 * Deliberately does no ownership check. It only discards cached HTML that is
 * already public, and the data it re-fetches is the same data any visitor
 * would receive, so the worst a caller can do is make a page render itself
 * again. Anything stronger would need the session this action does not have.
 */
export async function revalidateMiniSite(slug: string): Promise<{ ok: boolean }> {
  // Slugs build paths, so reject anything that could climb out of the
  // development's own namespace rather than trying to sanitise it.
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return { ok: false };

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/tour/cinematic`);
  revalidatePath(`/${slug}/tour/3d`);
  revalidatePath(`/${slug}/tour/vr`);
  // Unit pages inherit the development's branding, so a template change has to
  // reach them too; 'page' revalidates the whole dynamic segment.
  revalidatePath(`/${slug}/units/[unitId]`, 'page');

  return { ok: true };
}
