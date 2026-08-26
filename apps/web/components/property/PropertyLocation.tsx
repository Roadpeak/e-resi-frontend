'use client';

import {
  MapPin, ShoppingBag, Building2, Train, Plane, TreePine, Landmark,
  GraduationCap, UtensilsCrossed, Dumbbell, ShoppingCart, BedDouble,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { Address, Amenity } from '../../lib/types';
import { SectionHeading } from './SectionHeading';

// Leaflet touches `window` at import time, so it cannot be server-rendered.
const PropertyMiniMap = dynamic(
  () => import('./PropertyMiniMap').then((m) => m.PropertyMiniMap),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-gray-100" /> },
);

interface Props {
  address: Address;
  amenities: Amenity[];
}

// Keyed by the backend AmenityType enum — amenities are not lowercased on the
// read path, so the previous lowercase keys never matched and every entry fell
// back to a generic pin.
const amenityIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
  MALL: ShoppingBag,
  HOSPITAL: Building2,
  TRANSPORT: Train,
  AIRPORT: Plane,
  PARK: TreePine,
  BANK: Landmark,
  SCHOOL: GraduationCap,
  RESTAURANT: UtensilsCrossed,
  GYM: Dumbbell,
  SUPERMARKET: ShoppingCart,
  HOTEL: BedDouble,
};

export function PropertyLocation({ address, amenities }: Props) {

  return (
    <section id="location" className="scroll-mt-24">
      {/* "Amenities" here means the neighbourhood's, not the development's —
          on-site facilities are listed in the overview instead. */}
      <SectionHeading eyebrow="Location" title="Neighbourhood" />

      {/* items-stretch so the map panel matches the column beside it. It was
          pinned to a fixed 420px while the amenities list grew with its
          content, so the two columns ended at different heights and the map
          read as cut off. */}
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
        {/* Map */}
        <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-gray-200 lg:col-span-2">
          <PropertyMiniMap
            latitude={address.coordinates.lat}
            longitude={address.coordinates.lng}
            label={address.neighborhood}
            className="absolute inset-0 h-full w-full"
          />
        </div>

        {/* Amenities. Not animated in — this column sits beside a lazily
            mounted map embed, and an entrance animation here can stall and
            leave the address and the nearby list invisible. */}
        <div className="flex flex-col gap-4">
          {/* Address */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-gray-900" />
              <div>
                <p className="font-medium text-gray-900">{address.neighborhood}</p>
                <p className="text-sm text-gray-500 mt-0.5">{address.city}, {address.country}</p>
                <p className="text-xs text-gray-400 mt-1">{address.coordinates.lat.toFixed(4)}, {address.coordinates.lng.toFixed(4)}</p>
              </div>
            </div>
          </div>

          {/* Nearby — omitted entirely when the developer listed nothing,
              rather than showing an empty panel. */}
          {amenities.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wider text-xs">Nearby</p>
            <div className="flex flex-col gap-3">
              {amenities.map((amenity) => {
                const Icon = amenityIcons[amenity.type] ?? MapPin;
                return (
                  <div key={amenity.id} className="flex items-center gap-3">
                    {/* Bare glyph, in ink. A grey tile behind every amenity
                        turned a plain list into a grid of chips, and the icon
                        inside it was the platform's periwinkle rather than
                        anything the developer chose. */}
                    <Icon size={16} className="shrink-0 text-gray-900" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{amenity.name}</p>
                    </div>
                    {amenity.distance && (
                      <span className="text-xs text-gray-400 shrink-0">{amenity.distance}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
}
