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
  available: 'bg-green-500/15 text-green-400 border-green-500/20',
  partially_available: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  fully_let: 'bg-white/5 text-white/30 border-white/10',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Available', partially_available: 'Partially Available', fully_let: 'Fully Let',
};

export function PropertyRentListings({ listings }: Props) {
  if (listings.length === 0) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Home size={14} className="text-brand-400" />
            <span className="text-xs text-white/30 tracking-[0.2em] uppercase">For Rent</span>
          </div>
          <h2 className="font-display font-light text-white text-2xl sm:text-3xl">
            Rental units available
          </h2>
        </div>
        <Link
          href="/rent"
          className="hidden sm:inline-flex items-center gap-2 text-white/30 hover:text-white text-xs tracking-[0.1em] uppercase transition-colors"
        >
          All rentals <ArrowRight size={11} />
        </Link>
      </div>

      <div className="space-y-4">
        {listings.map((listing) => {
          const totalAvailable = listing.units.reduce((s, u) => s + u.available, 0);
          return (
            <div key={listing.id} className="rounded-2xl border border-white/8 bg-white/4 overflow-hidden">
              {/* Listing header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border', STATUS_STYLES[listing.status])}>
                    {STATUS_LABELS[listing.status]}
                  </span>
                  <span className="text-white/40 text-xs">{totalAvailable} units available</span>
                  <span className="text-white/20 text-xs">·</span>
                  <span className="text-white/40 text-xs">{FURNISHING_LABELS[listing.furnishing]}</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
                {listing.units.map((unit) => (
                  <div key={unit.id} className="bg-surface-950 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white text-sm">{unit.label}</p>
                        <p className="text-white/30 text-xs mt-0.5">{FURNISHING_LABELS[unit.furnishing]}</p>
                      </div>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full',
                        unit.available > 0 ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-white/30',
                      )}>
                        {unit.available > 0 ? `${unit.available} free` : 'Let'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-white/40 mb-3">
                      <span className="flex items-center gap-1">
                        <BedDouble size={10} />
                        {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}
                      </span>
                      <span className="flex items-center gap-1"><Maximize2 size={10} /> {unit.sqm}m²</span>
                      <span className="flex items-center gap-1"><Users size={10} /> {unit.total} total</span>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      <Calendar size={10} className="text-white/25" />
                      <span className="text-[10px] text-white/30">
                        From {new Date(listing.availableFrom).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                        · {listing.minLeaseTerm}mo min
                      </span>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-base font-bold text-white">{formatRent(unit.pricePerMonth, unit.currency)}</span>
                        <span className="text-xs text-white/30 ml-1">/mo</span>
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
              <div className="flex items-center justify-between px-6 py-3 border-t border-white/5">
                <p className="text-white/25 text-xs">{listing.developer.name}</p>
                <Link
                  href={`/rent/${listing.slug}`}
                  className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1"
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
