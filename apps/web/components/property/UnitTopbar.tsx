'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useArrivedFromMarketplace } from '../../lib/branding/use-arrived-from-marketplace';

/**
 * Topbar for a single unit.
 *
 * A unit page is part of the developer's mini-site, not our marketplace — it is
 * frequently the first page a buyer opens, because it is the link a sales agent
 * shares for a specific apartment. It previously rendered e-resi's marketplace
 * nav, which put our brand and links to rival developments on a page the
 * developer pays us to make theirs.
 *
 * So it always wears the development's identity — a serif wordmark, the way a
 * development brands its own hoarding — and offers a way back to the
 * marketplace only to visitors who actually came from there.
 */
export function UnitTopbar({
  propertySlug,
  propertyName,
  developerName,
  logoUrl,
  ctaLabel = 'Book a viewing',
}: {
  propertySlug: string;
  propertyName: string;
  developerName?: string | null;
  /** The developer's uploaded logo, when they have one. */
  logoUrl?: string | null;
  ctaLabel?: string;
}) {
  const fromMarketplace = useArrivedFromMarketplace(propertySlug);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.06] bg-white/90 backdrop-blur-md">
      {/* Same container as the page below it, so the wordmark sits flush over
          the breadcrumb and the CTA over the action rail. */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {/* The development, not e-resi. Links up to the mini-site rather than
              to our home page. */}
          <Link href={`/${propertySlug}`} className="group flex min-w-0 items-center gap-3">
            {logoUrl ? (
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-black/[0.06]">
                <Image src={logoUrl} alt="" fill className="object-cover" sizes="36px" />
              </span>
            ) : (
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-light text-white"
                style={{ background: 'var(--brand, #18191a)' }}
                aria-hidden="true"
              >
                {propertyName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-display text-[17px] font-light leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-gray-600">
                {propertyName}
              </span>
              {developerName && (
                <span className="block truncate text-[10.5px] font-medium uppercase tracking-[0.14em] leading-tight text-gray-400">
                  {developerName}
                </span>
              )}
            </span>
          </Link>

          {/* Only for visitors who were already browsing us. A buyer who opened
              a shared link is the developer's prospect, and handing them a
              route to a marketplace of competing developments would work
              against the person paying for this page. */}
          {fromMarketplace && (
            <span className="hidden items-center sm:flex">
              <span aria-hidden="true" className="mx-2 h-4 w-px bg-gray-200" />
              <Link
                href="/properties"
                className="group flex items-center gap-1.5 text-[13px] text-gray-400 transition-colors hover:text-gray-900"
              >
                <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
                All properties
              </Link>
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Back to the whole development — the natural next step from one
              unit, and on a phone the only navigation offered. */}
          <Link
            href={`/${propertySlug}`}
            className="hidden px-4 py-2 text-[13.5px] font-medium text-gray-500 transition-colors hover:text-gray-900 sm:inline-flex"
          >
            All units
          </Link>
          <Link
            href={`/${propertySlug}#booking`}
            className="rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--brand, #18191a)' }}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </nav>
  );
}
