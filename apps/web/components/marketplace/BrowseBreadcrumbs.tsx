'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Home, MapPin } from 'lucide-react';

const GEO_KEY = 'e-resi-geo-label';

/**
 * Coarse, permissionless location detection for the breadcrumb's right edge.
 *
 * IP lookup first (city-level, no browser prompt), cached for the session;
 * the timezone is the offline fallback so the label still says something
 * sensible when the lookup is blocked or slow. Deliberately NOT the
 * Geolocation API — a permission dialog on a browse page costs more trust
 * than a label is worth.
 */
function useDetectedLocation(): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(GEO_KEY);
      if (cached) {
        setLabel(cached);
        return;
      }
    } catch {
      // storage unavailable — detect fresh below
    }

    let cancelled = false;
    const timezoneFallback = () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const city = tz?.split('/').pop()?.replace(/_/g, ' ');
        return city || null;
      } catch {
        return null;
      }
    };

    const apply = (value: string | null) => {
      if (cancelled || !value) return;
      setLabel(value);
      try {
        sessionStorage.setItem(GEO_KEY, value);
      } catch {
        // fine — re-detected next page
      }
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const city = d?.city as string | undefined;
        const country = d?.country_name as string | undefined;
        apply(city ? (country ? `${city}, ${country}` : city) : timezoneFallback());
      })
      .catch(() => apply(timezoneFallback()))
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return label;
}

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
  const detected = useDetectedLocation();

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

      {detected && (
        <span className="ml-auto hidden items-center gap-1.5 text-[13px] text-[#6b6b70] sm:flex">
          <MapPin size={13} className="text-[#8a8a90]" />
          {detected}
        </span>
      )}
    </nav>
  );
}
