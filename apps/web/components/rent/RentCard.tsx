'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Bath, BedDouble, Box, ChevronLeft, ChevronRight, Heart, MapPin, Phone, Star } from 'lucide-react';
import { track } from '../../lib/analytics/track';
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
  // The cover first, then the listing's own gallery, so the arrows page
  // through the photos without opening the listing.
  const photos = [listing.heroImageUrl, ...(listing.galleryImages ?? [])]
    .filter((u, i, a): u is string => !!u && a.indexOf(u) === i)
    .slice(0, 8);
  const [photo, setPhoto] = useState(0);
  function step(e: React.MouseEvent, dir: 1 | -1) {
    e.preventDefault();
    e.stopPropagation();
    setPhoto((i) => (i + dir + photos.length) % photos.length);
  }
  const phone = listing.contact?.phone?.replace(/\s/g, '') || null;
  const waDigits = listing.contact?.whatsapp ? listing.contact.whatsapp.replace(/[^\d]/g, '').replace(/^0/, '254') : null;
  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hi, I'm interested in ${listing.name} on e-resi: https://e-resi.com/rent/${listing.slug}`)}`
    : null;

  // The card is one link, so contact actions are buttons that open the
  // channel themselves rather than nested anchors.
  function contact(e: React.MouseEvent, channel: 'phone' | 'whatsapp') {
    e.preventDefault();
    e.stopPropagation();
    track({ type: 'CONTACT_CLICK', rentListingId: listing.id, metadata: { channel } });
    if (channel === 'whatsapp' && waHref) window.open(waHref, '_blank', 'noopener,noreferrer');
    if (channel === 'phone' && phone) window.location.href = `tel:${phone}`;
  }

  return (
    <Link href={`/rent/${listing.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#f2f2f2]">
        {photos[photo] && (
          <Image key={photos[photo]} src={photos[photo]} alt={listing.name} fill
            className={cn('object-cover transition-transform duration-500 group-hover:scale-[1.04]', letOut && 'grayscale-[40%]')}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" />
        )}
        {photos.length > 1 && (
          <>
            <button type="button" onClick={(e) => step(e, -1)} aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#18181b] shadow-sm transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={(e) => step(e, 1)} aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#18181b] shadow-sm transition-opacity hover:bg-white sm:opacity-0 sm:group-hover:opacity-100">
              <ChevronRight size={16} />
            </button>
            <span className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1">
              {photos.map((u, i) => (
                <span key={u} className={cn('h-1.5 rounded-full bg-white transition-all', i === photo ? 'w-3.5 opacity-100' : 'w-1.5 opacity-60')} />
              ))}
            </span>
          </>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-[#18181b]">
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
        <h3 className="truncate text-[18px] font-medium tracking-[-0.01em] text-[#18181b]">{listing.name}</h3>
        <p className="mt-1.5 text-[16px] font-medium text-[#18181b]">
          {listing.priceFrom ? (
            <>{units.length > 1 && listing.priceTo > listing.priceFrom ? 'From ' : ''}{formatRent(listing.priceFrom, listing.currency)} <span className="text-[#18181b]">/ month</span></>
          ) : 'Rent on request'}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 text-[16px] text-[#52525b]">
            <MapPin size={14} className="shrink-0 text-[#f9ab00]" />
            <span className="truncate">{listing.address.neighborhood || listing.address.city}</span>
            {beds && <><span aria-hidden>•</span><span className="inline-flex shrink-0 items-center gap-1"><BedDouble size={14} /> {beds}</span></>}
            {baths && <span className="inline-flex shrink-0 items-center gap-1"><Bath size={14} /> {baths}</span>}
          </p>
          {(waHref || phone) && (
            <span className="flex shrink-0 items-center gap-1.5">
              {phone && (
                <button type="button" onClick={(e) => contact(e, 'phone')} aria-label="Call"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e3e3e3] bg-white text-[#18181b] transition-colors hover:bg-[#f2f2f2]">
                  <Phone size={15} />
                </button>
              )}
              {waHref && (
                <button type="button" onClick={(e) => contact(e, 'whatsapp')} aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25d366] text-white transition-colors hover:bg-[#1ebe5b]">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.97L2 22l5.2-1.5A9.93 9.93 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.9.9-3-.2-.31A8.22 8.22 0 1 1 12.04 20.1Zm4.5-6.13c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22a7.4 7.4 0 0 1-1.37-1.7c-.14-.25-.02-.38.1-.5.12-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.12.17 1.73 2.64 4.2 3.7.59.26 1.05.41 1.4.52.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.66-1.18.2-.57.2-1.07.14-1.17-.06-.1-.22-.16-.47-.28Z" />
                  </svg>
                </button>
              )}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
