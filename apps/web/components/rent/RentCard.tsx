'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bath, BedDouble, Box, Heart, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { RentListing } from '../../lib/types';
import { useSavedRentals } from './RentShell';

export function formatRent(price: number, currency: string) {
  return `${currency} ${Math.round(price).toLocaleString()}`;
}

const FURNISHING: Record<string, string> = {
  furnished: 'Furnished',
  semi_furnished: 'Semi-furnished',
  unfurnished: 'Unfurnished',
};

/** "1–3" / "Studio" / "2" — or null when the listing has no units yet. */
export function rangeOf(nums: number[], studio = false): string | null {
  const n = nums.filter((x) => Number.isFinite(x));
  if (!n.length) return null;
  const lo = Math.min(...n);
  const hi = Math.max(...n);
  const one = (v: number) => (studio && v === 0 ? 'Studio' : String(v));
  return lo === hi ? one(lo) : `${one(lo)}–${hi}`;
}

/**
 * A rental as a photo-first card: rounded image with the furnishing chip and
 * a featured star on the left, 3D and save on the right; then the name, the
 * monthly rent, and where it is with beds and baths.
 */
export function RentCard({ listing }: { listing: RentListing; index?: number }) {
  const { has, toggle } = useSavedRentals();
  const saved = has(listing.id);
  const units = listing.units ?? [];
  const beds = rangeOf(units.map((u) => u.bedrooms), true);
  const baths = rangeOf(units.map((u) => u.bathrooms));
  const left = units.reduce((s, u) => s + (u.available ?? 0), 0);
  const letOut = listing.status === 'fully_let';

  return (
    <Link href={`/rent/${listing.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#f2f2f2]">
        {listing.heroImageUrl && (
          <Image src={listing.heroImageUrl} alt={listing.name} fill
            className={cn('object-cover transition-transform duration-500 group-hover:scale-[1.04]', letOut && 'grayscale-[40%]')}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" />
        )}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-full bg-white px-3 py-1 text-[12.5px] font-semibold text-[#1d1d1f]">
            {letOut ? 'Fully let' : FURNISHING[listing.furnishing] ?? 'Rent'}
          </span>
          {listing.isFeatured && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white" title="Featured">
              <Star size={14} className="fill-[#e8710a] text-[#e8710a]" />
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {listing.show3DTour && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm" title="3D tour">
              <Box size={14} />
            </span>
          )}
          <button type="button" aria-label={saved ? 'Remove from saved' : 'Save'} aria-pressed={saved}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(listing.id); }}
            className={cn('flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors',
              saved ? 'bg-white text-[#d93025]' : 'bg-black/30 text-white hover:bg-black/45')}>
            <Heart size={15} className={saved ? 'fill-current' : ''} />
          </button>
        </div>
        {!letOut && left > 0 && left <= 3 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[12px] text-white backdrop-blur-sm">
            {left} unit{left === 1 ? '' : 's'} left
          </span>
        )}
      </div>
      <div className="px-0.5 pt-3">
        <h3 className="truncate text-[16.5px] font-semibold text-[#1d1d1f]">{listing.name}</h3>
        <p className="mt-1 text-[15px] font-semibold text-[#1d1d1f]">
          {listing.priceFrom ? (
            <>{units.length > 1 && listing.priceTo > listing.priceFrom ? 'From ' : ''}{formatRent(listing.priceFrom, listing.currency)} <span className="font-normal text-[#5f6368]">/ month</span></>
          ) : 'Rent on request'}
        </p>
        <p className="mt-1 flex items-center gap-2 text-[14px] text-[#5f6368]">
          <span className="truncate">{listing.address.neighborhood || listing.address.city}</span>
          {beds && <><span aria-hidden>•</span><span className="inline-flex shrink-0 items-center gap-1"><BedDouble size={14} /> {beds}</span></>}
          {baths && <span className="inline-flex shrink-0 items-center gap-1"><Bath size={14} /> {baths}</span>}
        </p>
      </div>
    </Link>
  );
}
