'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { MapPin, BedDouble, Maximize2, Film, Box, Calendar, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { RentListing } from '../../lib/types';

function formatRent(price: number, currency: string) {
  if (price >= 1_000_000) return `${currency} ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${currency} ${(price / 1_000).toFixed(0)}K`;
  return `${currency} ${price.toLocaleString()}`;
}

/** Deterministic pick of up to 3 gallery images, distinct from the hero. */
function pickGalleryPreview(listing: RentListing, count = 3) {
  const pool = listing.galleryImages.filter((url) => url && url !== listing.heroImageUrl);
  if (pool.length <= count) return pool;
  let seed = 0;
  for (let i = 0; i < listing.id.length; i++) seed = (seed * 31 + listing.id.charCodeAt(i)) >>> 0;
  const picked: string[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    let idx = seed % pool.length;
    while (used.has(idx)) idx = (idx + 1) % pool.length;
    used.add(idx);
    picked.push(pool[idx]);
  }
  return picked;
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
  const totalAvailable = listing.units.reduce((s, u) => s + u.available, 0);
  const minBeds = Math.min(...listing.units.map((u) => u.bedrooms));
  const maxBeds = Math.max(...listing.units.map((u) => u.bedrooms));
  const bedLabel = minBeds === maxBeds
    ? (minBeds === 0 ? 'Studio' : `${minBeds} Bed`)
    : `${minBeds === 0 ? 'Studio' : minBeds}–${maxBeds} Bed`;
  const galleryPreview = useMemo(() => pickGalleryPreview(listing), [listing]);

  return (
    <Link href={`/rent/${listing.slug}`} className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={listing.heroImageUrl}
          alt={listing.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Tour badges */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {listing.showCinematicTour && (
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              <Film size={12} /> Cinematic
            </span>
          )}
          {listing.show3DTour && (
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              <Box size={12} /> 3D
            </span>
          )}
        </div>
        {/* Featured */}
        {listing.isFeatured && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-orange-500 text-white text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Featured</span>
          </div>
        )}
      </div>

      {/* Gallery strip — 3 more shots from this listing's gallery */}
      {galleryPreview.length > 0 && (
        <div className="grid grid-cols-3 gap-1 px-3 pt-3">
          {galleryPreview.map((url, i) => (
            <div key={url + i} className="relative h-16 overflow-hidden rounded-lg sm:h-20">
              <Image src={url} alt="" fill className="object-cover" sizes="140px" />
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Location + status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-gray-400 text-sm min-w-0">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{listing.address.neighborhood}, {listing.address.city}</span>
          </div>
          <span
            className={cn(
              'shrink-0 text-xs font-semibold uppercase tracking-wide',
              listing.status === 'available' ? '' : 'px-2.5 py-1 rounded-full',
              STATUS_STYLES[listing.status],
            )}
          >
            {STATUS_LABELS[listing.status]}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1 truncate">{listing.name}</h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{listing.tagline}</p>

        {/* Specs row */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1.5"><BedDouble size={16} /> {bedLabel}</span>
          <span className="flex items-center gap-1.5"><Maximize2 size={16} /> {listing.units[0]?.sqm}m²+</span>
          <span className="flex items-center gap-1.5"><Users size={16} /> {totalAvailable} available</span>
        </div>

        {/* Furnishing + available from */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
            {FURNISHING_LABELS[listing.furnishing]}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={12} />
            From {new Date(listing.availableFrom).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xl font-bold text-gray-900">{formatRent(listing.priceFrom, listing.currency)}</span>
            <span className="text-sm text-gray-400 ml-1">/mo</span>
            {listing.priceTo > listing.priceFrom && (
              <span className="text-sm text-gray-400"> – {formatRent(listing.priceTo, listing.currency)}</span>
            )}
          </div>
          <span className="text-xs text-gray-400">{listing.minLeaseTerm}mo min</span>
        </div>
      </div>
    </Link>
  );
}
