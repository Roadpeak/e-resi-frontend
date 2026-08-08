'use client';

import Image from 'next/image';
import { MapPin, ImageOff } from 'lucide-react';
import { DirectoryCard, Tag } from './DirectoryPrimitives';
import { formatPrice } from '../../lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  APARTMENT: 'Apartment',
  VILLA: 'Villa',
  TOWNHOUSE: 'Townhouse',
  PENTHOUSE: 'Penthouse',
  OFFICE: 'Office',
  COMMERCIAL: 'Commercial',
  LAND: 'Land',
};

/**
 * Minimal shape both developersApi (which has `category`) and the map/
 * locations page (which doesn't) can satisfy — the category tag is cosmetic
 * and simply doesn't render when the field is absent.
 */
export interface DirectoryPropertyCardData {
  slug: string;
  name: string;
  heroImageUrl: string | null;
  city: string;
  neighborhood?: string | null;
  priceFrom: number | null;
  priceTo?: number | null;
  currency: string;
  category?: string;
}

/**
 * Lightweight property card for directory-style pages (developer profile,
 * map/locations). Uses only the fields those endpoints actually return —
 * PropertyCard needs the full normalized Property (units, floor plans) that
 * this data doesn't carry.
 */
export function DirectoryPropertyCard({ property }: { property: DirectoryPropertyCardData }) {
  const priceLabel = property.priceFrom
    ? property.priceTo && property.priceTo !== property.priceFrom
      ? `${formatPrice(property.priceFrom, property.currency)} – ${formatPrice(property.priceTo, property.currency)}`
      : formatPrice(property.priceFrom, property.currency)
    : 'Price on request';

  return (
    <DirectoryCard href={`/${property.slug}`} className="overflow-hidden">
      <div className="relative h-44 w-full bg-[#f0f0f2]">
        {property.heroImageUrl ? (
          <Image
            src={property.heroImageUrl}
            alt={property.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff size={22} className="text-[#c4c4c8]" />
          </div>
        )}
        {property.category && (
          <Tag tone="purple" className="absolute left-3 top-3 bg-white/90">
            {CATEGORY_LABELS[property.category] ?? property.category}
          </Tag>
        )}
      </div>

      <div className="p-4">
        <h3 className="truncate text-[15px] font-semibold text-[#111112]">{property.name}</h3>
        <p className="mt-1 flex items-center gap-1 truncate text-[13px] text-[#6b6b70]">
          <MapPin size={12} className="shrink-0" />
          {[property.neighborhood, property.city].filter(Boolean).join(', ')}
        </p>
        <p className="mt-3 text-[15px] font-semibold text-[#111112]">{priceLabel}</p>
      </div>
    </DirectoryCard>
  );
}
