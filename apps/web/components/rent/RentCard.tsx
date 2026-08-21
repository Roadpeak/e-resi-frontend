'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, BedDouble, Maximize2, Film, Box, Calendar, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { RentListing } from '../../lib/types';

function formatRent(price: number, currency: string) {
  if (price >= 1_000_000) return `${currency} ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${currency} ${(price / 1_000).toFixed(0)}K`;
  return `${currency} ${price.toLocaleString()}`;
}

/** "available" reads as plain blue text — no pill background; the other two
 *  statuses keep their pastel badge treatment. */
const STATUS_STYLES: Record<string, string> = {
  available:           'text-[#4A80F5]',
  partially_available: 'bg-orange-100 text-orange-600',
  fully_let:           'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  available:           'Available',
  partially_available: 'Partially Available',
  fully_let:           'Fully Let',
};

const FURNISHING_LABELS: Record<string, string> = {
  furnished:       'Furnished',
  semi_furnished:  'Semi-Furnished',
  unfurnished:     'Unfurnished',
};

interface Props {
  listing: RentListing;
  index?: number;
}

export function RentCard({ listing }: Props) {
  const units = listing.units ?? [];
  const totalAvailable = units.reduce((s, u) => s + u.available, 0);

  /**
   * A listing can exist before its units are entered, and Math.min of nothing
   * is Infinity — which rendered as "Infinity–-Infinity Bed" on the card.
   * Both the bed range and the floor area are omitted when there is nothing
   * to derive them from.
   */
  const beds = units.map((u) => u.bedrooms).filter((n) => Number.isFinite(n));
  const minBeds = beds.length ? Math.min(...beds) : null;
  const maxBeds = beds.length ? Math.max(...beds) : null;
  const bedLabel = minBeds === null || maxBeds === null
    ? null
    : minBeds === maxBeds
      ? (minBeds === 0 ? 'Studio' : `${minBeds} Bed`)
      : `${minBeds === 0 ? 'Studio' : minBeds}–${maxBeds} Bed`;

  // Smallest unit that actually states a size, rather than units[0] — which
  // showed "0m²+" whenever the first unit happened to have none.
  const sizes = units.map((u) => u.sqm).filter((n): n is number => typeof n === 'number' && n > 0);
  const minSqm = sizes.length ? Math.min(...sizes) : null;

  return (
    <Link href={`/rent/${listing.slug}`} className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={listing.heroImageUrl}
          alt={listing.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Tour badges */}
        <div className="absolute right-2 top-2 flex gap-1">
          {listing.showCinematicTour && (
            <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
              <Film size={10} /> Cinematic
            </span>
          )}
          {listing.show3DTour && (
            <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
              <Box size={10} /> 3D
            </span>
          )}
        </div>
        {/* Featured */}
        {listing.isFeatured && (
          <div className="absolute bottom-2 left-2">
            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Featured</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Location + status */}
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 text-[12px] text-gray-400">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{listing.address.neighborhood}, {listing.address.city}</span>
          </div>
          <span
            className={cn(
              'shrink-0 text-[10px] font-semibold uppercase tracking-wide',
              listing.status === 'available' ? '' : 'rounded-full px-2 py-0.5',
              STATUS_STYLES[listing.status],
            )}
          >
            {STATUS_LABELS[listing.status]}
          </span>
        </div>

        <h3 className="mb-2 truncate text-[15px] font-semibold leading-tight text-gray-900">
          {listing.name}
        </h3>

        {/* Specs row */}
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-500">
          {bedLabel && (
            <span className="flex items-center gap-1"><BedDouble size={13} /> {bedLabel}</span>
          )}
          {minSqm !== null && (
            <span className="flex items-center gap-1"><Maximize2 size={13} /> {minSqm}m²+</span>
          )}
          {totalAvailable > 0 && (
            <span className="flex items-center gap-1"><Users size={13} /> {totalAvailable}</span>
          )}
        </div>

        {/* Furnishing + available from */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
            {FURNISHING_LABELS[listing.furnishing]}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Calendar size={10} />
            {new Date(listing.availableFrom).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Price */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <div className="min-w-0">
            <span className="text-[16px] font-bold text-gray-900">{formatRent(listing.priceFrom, listing.currency)}</span>
            <span className="ml-0.5 text-[11px] text-gray-400">/mo</span>
          </div>
          <span className="text-[10px] text-gray-400">{listing.minLeaseTerm}mo min</span>
        </div>
      </div>
    </Link>
  );
}
