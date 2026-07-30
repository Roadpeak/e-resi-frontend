'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, X, BedDouble, Bath, Maximize2, Star } from 'lucide-react';
import type { Property } from '../../lib/types';
import { formatPrice, cn } from '../../lib/utils';

interface Props { properties: Property[] }

function coordToPercent(lat: number, lng: number) {
  const x = ((lng - 36.65) / (37.05 - 36.65)) * 100;
  const y = ((lat - (-1.17)) / ((-1.45) - (-1.17))) * 100;
  return { x: Math.max(5, Math.min(92, x)), y: Math.max(8, Math.min(88, y)) };
}

const pinColors: Record<string, string> = {
  ready: 'bg-green-500 border-green-600',
  off_plan: 'bg-orange-500 border-orange-600',
  under_construction: 'bg-yellow-400 border-yellow-500',
};

export function PropertiesMapView({ properties }: Props) {
  const [selected, setSelected] = useState<Property | null>(null);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{
      background: 'linear-gradient(160deg, #e8f0e4 0%, #dde8d8 30%, #d8e4d2 60%, #e4ddd4 100%)',
    }}>
      {/* Map roads */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Major roads */}
        <line x1="0" y1="50" x2="100" y2="48" stroke="#fff" strokeWidth="1.2" opacity="0.8" />
        <line x1="0" y1="33" x2="100" y2="38" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
        <line x1="0" y1="67" x2="100" y2="63" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="#fff" strokeWidth="1.2" opacity="0.8" />
        <line x1="28" y1="0" x2="30" y2="100" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
        <line x1="72" y1="0" x2="70" y2="100" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
        {/* Diagonals */}
        <line x1="0" y1="18" x2="60" y2="82" stroke="#fff" strokeWidth="0.4" opacity="0.5" />
        <line x1="42" y1="0" x2="100" y2="68" stroke="#fff" strokeWidth="0.4" opacity="0.5" />
        {/* Blocks */}
        <rect x="33" y="20" width="14" height="10" fill="#cddbc8" rx="0.5" opacity="0.8" />
        <rect x="54" y="20" width="13" height="10" fill="#cddbc8" rx="0.5" opacity="0.8" />
        <rect x="33" y="58" width="14" height="9" fill="#cddbc8" rx="0.5" opacity="0.8" />
        <rect x="54" y="56" width="12" height="10" fill="#cddbc8" rx="0.5" opacity="0.8" />
        <rect x="18" y="36" width="8" height="12" fill="#cddbc8" rx="0.5" opacity="0.8" />
        <rect x="76" y="37" width="8" height="10" fill="#cddbc8" rx="0.5" opacity="0.8" />
        {/* Park */}
        <ellipse cx="50" cy="50" rx="5" ry="4" fill="#b8d4b0" opacity="0.9" />
        <ellipse cx="22" cy="72" rx="6" ry="4" fill="#b8d4b0" opacity="0.7" />
      </svg>

      {/* Pins */}
      {properties.map((property) => {
        const { x, y } = coordToPercent(property.address.coordinates.lat, property.address.coordinates.lng);
        const isSelected = selected?.id === property.id;

        return (
          <button
            key={property.id}
            onClick={() => setSelected(isSelected ? null : property)}
            className="absolute z-10 -translate-x-1/2 -translate-y-full cursor-pointer"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {isSelected ? (
              // Selected: heart pin like the reference
              <div className="flex flex-col items-center">
                <div className="bg-red-500 rounded-full p-2 shadow-lg shadow-red-300">
                  <MapPin size={14} className="text-white fill-white" />
                </div>
              </div>
            ) : (
              // Normal: circle dot
              <div className={cn(
                'w-4 h-4 rounded-full border-2 shadow-md transition-transform hover:scale-125',
                pinColors[property.status] ?? 'bg-blue-500 border-blue-600',
              )} />
            )}
          </button>
        );
      })}

      {/* Selected popup */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-5 right-5 z-20 w-64"
          >
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-gray-300/60">
              {/* Image with nav arrows */}
              <div className="relative h-36">
                <Image src={selected.heroImageUrl} alt={selected.name} fill className="object-cover" sizes="256px" />
                {/* Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {[0,1,2].map((i) => (
                    <span key={i} className={cn('w-1.5 h-1.5 rounded-full', i === 0 ? 'bg-white' : 'bg-white/50')} />
                  ))}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer shadow-sm"
                >
                  <X size={11} />
                </button>
                {/* Fav */}
                <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm">
                  <Star size={11} className="fill-red-400 text-red-400" />
                </div>
              </div>

              {/* Info */}
              <div className="p-3.5">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{selected.name}</h3>
                <div className="flex items-center justify-between mt-1.5 mb-2.5">
                  <div>
                    <span className="font-bold text-gray-900 text-base">{formatPrice(selected.priceFrom, selected.currency)}</span>
                    <span className="text-xs text-gray-400 ml-1">from</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><BedDouble size={11} /> {selected.floorPlans[0]?.bedrooms ?? 0}</span>
                  <span className="flex items-center gap-1"><Bath size={11} /> {selected.floorPlans[0]?.bathrooms ?? 1}</span>
                  <span className="flex items-center gap-1"><Maximize2 size={11} /> {selected.floorPlans[0]?.sqm ?? 0}m²</span>
                </div>
                <Link
                  href={`/${selected.slug}`}
                  className="mt-3 block text-center rounded-xl bg-gray-900 text-white text-xs font-medium py-2 hover:bg-gray-700 transition-colors"
                >
                  View property →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attribution */}
      <div className="absolute bottom-3 left-4 text-[10px] text-gray-400">
        {properties.length} properties · Nairobi
      </div>
    </div>
  );
}
