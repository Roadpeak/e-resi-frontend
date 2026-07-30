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

const STATUS_STYLES: Record<string, string> = {
  available:           'bg-green-100 text-green-700',
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
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full', STATUS_STYLES[listing.status])}>
            {STATUS_LABELS[listing.status]}
          </span>
        </div>
        {/* Tour badges */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {listing.showCinematicTour && (
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full">
              <Film size={9} /> Cinematic
            </span>
          )}
          {listing.show3DTour && (
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full">
              <Box size={9} /> 3D
            </span>
          )}
        </div>
        {/* Featured */}
        {listing.isFeatured && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-orange-500 text-white text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Featured</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Location */}
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
          <MapPin size={10} />
          <span>{listing.address.neighborhood}, {listing.address.city}</span>
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 truncate">{listing.name}</h3>
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{listing.tagline}</p>

        {/* Specs row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><BedDouble size={11} /> {bedLabel}</span>
          <span className="flex items-center gap-1"><Maximize2 size={11} /> {listing.units[0]?.sqm}m²+</span>
          <span className="flex items-center gap-1"><Users size={11} /> {totalAvailable} available</span>
        </div>

        {/* Furnishing + available from */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {FURNISHING_LABELS[listing.furnishing]}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Calendar size={9} />
            From {new Date(listing.availableFrom).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-base font-bold text-gray-900">{formatRent(listing.priceFrom, listing.currency)}</span>
            <span className="text-xs text-gray-400 ml-1">/mo</span>
            {listing.priceTo > listing.priceFrom && (
              <span className="text-xs text-gray-400"> – {formatRent(listing.priceTo, listing.currency)}</span>
            )}
          </div>
          <span className="text-[10px] text-gray-400">{listing.minLeaseTerm}mo min</span>
        </div>
      </div>
    </Link>
  );
}
