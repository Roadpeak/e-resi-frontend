'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Maximize2, Box, Headset, Heart, Star, Film } from 'lucide-react';
import { useState } from 'react';
import type { Property } from '../../lib/types';
import { formatPrice, getStatusLabel, getStatusColor, cn } from '../../lib/utils';

interface PropertyCardProps {
  property: Property;
  index?: number;
  view?: 'grid' | 'list';
}

const statusColors: Record<string, string> = {
  ready: 'bg-green-100 text-green-700',
  off_plan: 'bg-orange-100 text-orange-600',
  under_construction: 'bg-yellow-100 text-yellow-700',
  sold_out: 'bg-gray-100 text-gray-500',
};

// Fake ratings for visual richness (real data would come from API)
const fakeRating = (id: string) => {
  const seed = id.charCodeAt(0);
  return (4.2 + (seed % 8) / 10).toFixed(1);
};
const fakeReviews = (id: string) => {
  const seed = id.charCodeAt(0);
  return 40 + (seed % 200);
};

const isNew = (property: Property) => {
  if (property.isFeatured) return true;
  const created = new Date(property.createdAt).getTime();
  return !Number.isNaN(created) && Date.now() - created < 60 * 24 * 60 * 60 * 1000;
};

export function PropertyCard({ property, index = 0, view = 'grid' }: PropertyCardProps) {
  const [saved, setSaved] = useState(false);
  const rating = fakeRating(property.id);
  const reviews = fakeReviews(property.id);
  const bed = property.floorPlans[0] ?? property.units[0];

  if (view === 'list') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="group relative flex gap-4 rounded-2xl bg-white p-3 shadow-sm shadow-gray-200/80 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200"
      >
        {/* Whole-card link */}
        <Link href={`/${property.slug}`} aria-label={property.name} className="absolute inset-0 z-[1] rounded-2xl" />

        {/* Image */}
        <div className="relative h-32 w-36 shrink-0 overflow-hidden rounded-2xl sm:h-36 sm:w-52">
          {property.heroImageUrl ? (
            <Image
              src={property.heroImageUrl}
              alt={property.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="208px"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-100" />
          )}
          {isNew(property) && (
            <span className="absolute left-2 top-2 rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              New
            </span>
          )}
          <span className={cn('absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold', getStatusColor(property.status))}>
            {getStatusLabel(property.status)}
          </span>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900 transition-colors group-hover:text-brand-600">
                {property.name}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400">
                <MapPin size={10} className="shrink-0" />
                {property.address.street ? `${property.address.street}, ` : ''}
                {property.address.neighborhood}, {property.address.city}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-base font-bold text-gray-900 sm:text-lg">
                {formatPrice(property.priceFrom, property.currency)}
              </p>
              <p className="text-[11px] text-gray-400">from</p>
            </div>
          </div>

          {/* Rating + tour badges + availability */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-1">
              <Star size={11} className="fill-gold-400 text-gold-400" />
              <span className="text-xs font-semibold text-gray-700">{rating}</span>
              <span className="text-xs text-gray-400">({reviews})</span>
            </span>
            {property.has3DTour && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-brand-600"><Box size={9} /> 3D</span>
            )}
            {property.hasVRTour && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-purple-500"><Headset size={9} /> VR</span>
            )}
            {property.hasCinematicTour && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600"><Film size={9} /> Cinematic</span>
            )}
            <span className="text-[10px] text-gray-400">
              · {property.availableUnits}/{property.totalUnits} units available
            </span>
          </div>

          {/* Bottom row: stat chips + heart */}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {bed && (
                <>
                  <StatChip icon={<BedDouble size={11} />} label={bed.bedrooms === 0 ? 'Studio' : `${bed.bedrooms}`} />
                  <StatChip icon={<Bath size={11} />} label={`${bed.bathrooms}`} />
                  <StatChip icon={<Maximize2 size={11} />} label={`${bed.sqm} m²`} />
                </>
              )}
            </div>
            <button
              onClick={(e) => { e.preventDefault(); setSaved((v) => !v); }}
              aria-label={saved ? 'Remove from saved' : 'Save property'}
              className="relative z-10 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition-colors hover:border-gold-300 hover:text-gold-500"
            >
              <Heart size={14} className={cn(saved && 'fill-gold-400 text-gold-400')} />
            </button>
          </div>
        </div>
      </motion.article>
    );
  }

  // Grid card
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white rounded-2xl shadow-sm shadow-gray-200 overflow-hidden hover:shadow-lg hover:shadow-gray-200/80 transition-all duration-300"
    >
      {/* Image */}
      <Link href={`/${property.slug}`} className="relative block overflow-hidden" style={{ paddingBottom: '65%' }}>
        {property.heroImageUrl ? (
          <Image
            src={property.heroImageUrl}
            alt={property.name}
            fill
            className="object-cover transition-transform duration-600 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100" />
        )}

        {/* Save button */}
        <button
          onClick={(e) => { e.preventDefault(); setSaved((v) => !v); }}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
        >
          <Heart size={14} className={cn(saved && 'fill-red-400 text-red-400')} />
        </button>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold', statusColors[property.status])}>
            {getStatusLabel(property.status)}
          </span>
        </div>

        {/* Tour badges */}
        {(property.has3DTour || property.hasVRTour) && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {property.has3DTour && (
              <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                <Box size={9} /> 3D
              </span>
            )}
            {property.hasVRTour && (
              <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                <Headset size={9} /> VR
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-4">
        {/* Price + rating */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <span className="font-bold text-gray-900 text-base">{formatPrice(property.priceFrom, property.currency)}</span>
            <span className="text-xs text-gray-400 ml-1">from</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-gray-700">{rating}</span>
            <span className="text-xs text-gray-400">({reviews})</span>
          </div>
        </div>

        {/* Name + location */}
        <Link href={`/${property.slug}`}>
          <h3 className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-orange-500 transition-colors line-clamp-1">
            {property.name}
          </h3>
        </Link>
        <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5 mb-3">
          <MapPin size={9} /> {property.address.neighborhood}, {property.address.city}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {bed && (
            <>
              <span className="flex items-center gap-1"><BedDouble size={11} /> {bed.bedrooms === 0 ? 'Studio' : bed.bedrooms}</span>
              <span className="flex items-center gap-1"><Bath size={11} /> {bed.bathrooms}</span>
              <span className="flex items-center gap-1"><Maximize2 size={11} /> {bed.sqm}m²</span>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700">
      {icon} {label}
    </span>
  );
}
