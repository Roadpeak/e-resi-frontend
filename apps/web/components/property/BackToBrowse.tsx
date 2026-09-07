'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BROWSE_RETURN_KEY } from '../marketplace/BrowseBreadcrumbs';

/**
 * "Back to all properties", shown only when the visitor actually came through
 * a browse page. The listing pages record their URL in sessionStorage as they
 * render; a property opened from a shared link lands in a tab with no such
 * record, so the pill stays away and the page reads as its own front door.
 */
export function BackToBrowse() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    try {
      setHref(sessionStorage.getItem(BROWSE_RETURN_KEY));
    } catch {
      // No storage, no pill.
    }
  }, []);

  if (!href) return null;

  return (
    <Link
      href={href}
      className="fixed left-4 top-20 z-40 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-[13.5px] font-medium text-[#111112] shadow-sm backdrop-blur-md transition-colors hover:bg-white"
    >
      <ArrowLeft size={14} /> Back to all properties
    </Link>
  );
}
