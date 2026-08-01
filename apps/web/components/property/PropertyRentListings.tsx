'use client';

import Link from 'next/link';
import { Home, BedDouble, Maximize2, Film, Box, Calendar, Users, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { RentListing } from '../../lib/types';

interface Props { listings: RentListing[]; }

function formatRent(price: number, currency: string) {
  if (price >= 1_000_000) return `${currency} ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${currency} ${(price / 1_000).toFixed(0)}K`;
  return `${currency} ${price.toLocaleString()}`;
}

const FURNISHING_LABELS: Record<string, string> = {
  furnished: 'Furnished', semi_furnished: 'Semi-Furnished', unfurnished: 'Unfurnished',
};

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-500/15 text-green-600 border-green-500/20',
  partially_available: 'bg-orange-500/15 text-orange-600 border-orange-500/20',
  fully_let: 'bg-gray-100 text-gray-400 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Available', partially_available: 'Partially Available', fully_let: 'Fully Let',
};

export function PropertyRentListings({ listings }: Props) {
  if (listings.length === 0) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-400">
            <Home size={13} /> For Rent
          </p>
          <h2 className="text-3xl font-semibold text-gray-900">
            Rental units available
          </h2>
        </div>
        <Link
          href="/rent"
          className="hidden sm:inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-xs font-medium uppercase tracking-wider transition-colors"
        >
          All rentals <ArrowRight size={11} />
        </Link>
      </div>

      <div className="space-y-4">
        {listings.map((listing) => {
          const totalAvailable = listing.units.reduce((s, u) => s + u.available, 0);
          return (
            <div key={listing.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              {/* Listing header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border', STATUS_STYLES[listing.status])}>
                    {STATUS_LABELS[listing.status]}
                  </span>
                  <span className="text-gray-500 text-xs">{totalAvailable} units available</span>
                  <span className="text-gray-400 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{FURNISHING_LABELS[listing.furnishing]}</span>
                </div>
                <div className="flex items-center gap-2">
                  {listing.showCinematicTour && (
                    <Link
                      href={`/${listing.propertySlug}/tour/cinematic`}
                      className="flex items-center gap-1 text-[10px] border border-warm-500/20 bg-warm-500/10 text-warm-400 px-2.5 py-1 rounded-full hover:bg-warm-500/20 transition-colors"
                    >
                      <Film size={9} /> Cinematic Tour
                    </Link>
                  )}
                  {listing.show3DTour && (
                    <Link
                      href={`/${listing.propertySlug}/tour/3d`}
                      className="flex items-center gap-1 text-[10px] border border-brand-500/20 bg-brand-500/10 text-brand-400 px-2.5 py-1 rounded-full hover:bg-brand-500/20 transition-colors"
                    >
                      <Box size={9} /> 3D Tour
                    </Link>
                  )}
                </div>
              </div>

              {/* Unit types grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
                {listing.units.map((unit) => (
                  <div key={unit.id} className="bg-white p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{unit.label}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{FURNISHING_LABELS[unit.furnishing]}</p>
                      </div>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full',
                        unit.available > 0 ? 'bg-green-500/15 text-green-600' : 'bg-gray-100 text-gray-400',
                      )}>
                        {unit.available > 0 ? `${unit.available} free` : 'Let'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <BedDouble size={10} />
                        {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}
                      </span>
                      <span className="flex items-center gap-1"><Maximize2 size={10} /> {unit.sqm}m²</span>
                      <span className="flex items-center gap-1"><Users size={10} /> {unit.total} total</span>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      <Calendar size={10} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400">
                        From {new Date(listing.availableFrom).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                        · {listing.minLeaseTerm}mo min
                      </span>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-base font-bold text-gray-900">{formatRent(unit.pricePerMonth, unit.currency)}</span>
                        <span className="text-xs text-gray-400 ml-1">/mo</span>
                      </div>
                      <Link
                        href={`/rent/${listing.slug}#${unit.id}`}
                        className="text-[10px] text-brand-400 hover:text-brand-300 tracking-[0.1em] uppercase transition-colors"
                      >
                        Enquire →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                <p className="text-gray-400 text-xs">{listing.developer.name}</p>
                <Link
                  href={`/rent/${listing.slug}`}
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  View full listing <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
