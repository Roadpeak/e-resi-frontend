'use client';

import { motion } from 'framer-motion';
import { MapPin, ShoppingBag, Building2, Train, Plane, TreePine, Landmark } from 'lucide-react';
import type { Address, Amenity } from '../../lib/types';

interface Props {
  address: Address;
  amenities: Amenity[];
}

const amenityIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
  mall: ShoppingBag,
  hospital: Building2,
  transport: Train,
  airport: Plane,
  park: TreePine,
  bank: Landmark,
  school: Landmark,
  restaurant: Landmark,
};

export function PropertyLocation({ address, amenities }: Props) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${address.coordinates.lng - 0.02},${address.coordinates.lat - 0.02},${address.coordinates.lng + 0.02},${address.coordinates.lat + 0.02}&layer=mapnik&marker=${address.coordinates.lat},${address.coordinates.lng}`;

  return (
    <section id="location" className="scroll-mt-24">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-brand-400">Location</p>
      <h2 className="mb-8 text-3xl font-semibold text-white">Neighbourhood & Amenities</h2>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2 overflow-hidden rounded-3xl border border-white/5"
          style={{ height: '420px' }}
        >
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            title={`Map of ${address.neighborhood}`}
            style={{ filter: 'invert(90%) hue-rotate(180deg)', border: 'none' }}
          />
        </motion.div>

        {/* Amenities */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex flex-col gap-4"
        >
          {/* Address */}
          <div className="rounded-2xl border border-white/5 bg-surface-800 p-5">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-brand-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-white">{address.neighborhood}</p>
                <p className="text-sm text-white/40 mt-0.5">{address.city}, {address.country}</p>
                <p className="text-xs text-white/25 mt-1">{address.coordinates.lat.toFixed(4)}, {address.coordinates.lng.toFixed(4)}</p>
              </div>
            </div>
          </div>

          {/* Nearby */}
          <div className="rounded-2xl border border-white/5 bg-surface-800 p-5">
            <p className="mb-4 text-sm font-medium text-white/60 uppercase tracking-wider text-xs">Nearby</p>
            <div className="flex flex-col gap-3">
              {amenities.map((amenity) => {
                const Icon = amenityIcons[amenity.type] ?? MapPin;
                return (
                  <div key={amenity.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-700">
                      <Icon size={14} className="text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{amenity.name}</p>
                    </div>
                    {amenity.distance && (
                      <span className="text-xs text-white/30 shrink-0">{amenity.distance}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
