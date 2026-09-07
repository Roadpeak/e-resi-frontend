'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

/** Where a property view can send the visitor back to. Session-scoped: a
 *  shared link opened in a fresh tab has no browse history to return to. */
export const BROWSE_RETURN_KEY = 'e-resi-browse-return';

/**
 * The small trail above a listing page's hero — home › Buy/Rent › this page.
 * Mounting it also records the page (with its query string) as the visitor's
 * browse origin, which is what powers "Back to all properties" on a property
 * they open from here.
 */
export function BrowseBreadcrumbs({ group, label }: { group: 'buy' | 'rent'; label: string }) {
  useEffect(() => {
    try {
      sessionStorage.setItem(
        BROWSE_RETURN_KEY,
        window.location.pathname + window.location.search,
      );
    } catch {
      // Private browsing may refuse storage — the back pill simply won't show.
    }
  }, []);

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-[13.5px] text-[#6b6b70]">
      <Link href="/" aria-label="Home" className="transition-colors hover:text-[#111112]">
        <Home size={14} />
      </Link>
      <ChevronRight size={13} className="text-[#b9b9be]" />
      <Link
        href={group === 'buy' ? '/properties' : '/rent'}
        className="transition-colors hover:text-[#111112]"
      >
        {group === 'buy' ? 'Buy' : 'Rent'}
      </Link>
      <ChevronRight size={13} className="text-[#b9b9be]" />
      <span className="font-medium text-[#111112]">{label}</span>
    </nav>
  );
}
