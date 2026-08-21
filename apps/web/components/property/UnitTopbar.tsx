'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
 * So it now always wears the development's identity, and offers a way back to
 * the marketplace only to visitors who actually came from there.
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
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.07] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {/* The development, not e-resi. Links up to the mini-site rather than
              to our home page. */}
          <Link href={`/${propertySlug}`} className="flex min-w-0 items-center gap-2.5">
            {logoUrl ? (
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                <Image src={logoUrl} alt="" fill className="object-cover" sizes="32px" />
              </span>
            ) : (
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold text-white"
                style={{ background: 'var(--brand, #1a73e8)' }}
                aria-hidden="true"
              >
                {propertyName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold leading-tight text-neutral-900">
                {propertyName}
              </span>
              {developerName && (
                <span className="block truncate text-[11px] leading-tight text-neutral-500">
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
            <span className="hidden items-center gap-1 sm:flex">
              <ChevronRight size={13} className="text-neutral-300" />
              <Link
                href="/properties"
                className="group flex items-center gap-1 text-[13px] text-neutral-500 transition-colors hover:text-neutral-900"
              >
                <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
                All properties
              </Link>
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Back to the whole development — the natural next step from one
              unit, and on a phone the only navigation offered. */}
          <Link
            href={`/${propertySlug}`}
            className="hidden rounded-full border border-neutral-200 px-4 py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 sm:inline-flex"
          >
            All units
          </Link>
          <Link
            href={`/${propertySlug}#booking`}
            className="rounded-full px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--brand, #18191a)' }}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </nav>
  );
}
