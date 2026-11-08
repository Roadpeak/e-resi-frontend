'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Soft page transitions for e-resi's public pages (not the dashboards).
 *
 * On an internal link click between public pages, the change runs inside a
 * View Transition: the new page rises in through a feathered mask while the
 * old one holds still, and the new page's blocks fade up from a light blur
 * (see `.vt-in` and `::view-transition-new(root)` in global.css). Browsers
 * without View Transitions, and visitors who prefer reduced motion, get the
 * normal instant navigation.
 */

/** Signed-in workspaces keep instant navigation. */
const APP_AREAS = ['/dashboard', '/agent', '/admin', '/account', '/onboarding', '/site/agent-preview'];
const isPublic = (path: string) => !APP_AREAS.some((p) => path === p || path.startsWith(`${p}/`));

type VTDocument = Document & { startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void> } };

export function PageTransitions() {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const search = useSearchParams();
  const pending = useRef<(() => void) | null>(null);
  const unitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The new route has rendered: let the transition capture it.
  useEffect(() => {
    const done = pending.current;
    if (!done) return;
    pending.current = null;
    requestAnimationFrame(() => done());
  }, [pathname, search]);

  useEffect(() => {
    const doc = document as VTDocument;
    if (!doc.startViewTransition) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || !a.href || a.hasAttribute('download') || (a.target && a.target !== '_self') || a.dataset.noTransition !== undefined) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const here = window.location;
      // Same page (or just a #section on it): leave it to the browser.
      if (url.pathname === here.pathname && url.search === here.search) return;
      if (!isPublic(here.pathname) || !isPublic(url.pathname)) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      e.preventDefault();
      const root = document.documentElement;
      // Tells the global fade (layout/PageTransition) to stand aside.
      root.dataset.vt = 'running';
      const vt = doc.startViewTransition!(() => new Promise<void>((resolve) => {
        pending.current = () => {
          // The unit fade runs on the live page, under the reveal.
          root.classList.remove('vt-in');
          void root.offsetWidth;
          root.classList.add('vt-in');
          clearTimeout(unitTimer.current);
          unitTimer.current = setTimeout(() => root.classList.remove('vt-in'), 2000);
          resolve();
        };
        router.push(url.pathname + url.search + url.hash);
        // Never hold the screen frozen if a route is slow to render.
        setTimeout(() => { if (pending.current) { pending.current(); pending.current = null; } }, 1800);
      }));
      vt.finished.finally(() => { delete root.dataset.vt; });
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router]);

  return null;
}
