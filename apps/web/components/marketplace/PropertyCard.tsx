'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Maximize2, Box, Headset, Heart, Star } from 'lucide-react';
import { useState } from 'react';
import type { Property } from '../../lib/types';
import { formatPrice, getStatusLabel, cn } from '../../lib/utils';

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

export function PropertyCard({ property, index = 0, view = 'grid' }: PropertyCardProps) {
  const [saved, setSaved] = useState(false);
  const rating = fakeRating(property.id);
  const reviews = fakeReviews(property.id);
  const bed = property.floorPlans[0];

  if (view === 'list') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="group flex bg-white rounded-2xl shadow-sm shadow-gray-200 overflow-hidden hover:shadow-md hover:shadow-gray-200 transition-all duration-300"
      >
        {/* Image */}
        <Link href={`/${property.slug}`} className="relative w-48 sm:w-64 shrink-0 overflow-hidden">
          <Image
            src={property.heroImageUrl}
            alt={property.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="256px"
          />
          <button
            onClick={(e) => { e.preventDefault(); setSaved((v) => !v); }}
            className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Heart size={13} className={cn(saved && 'fill-red-400 text-red-400')} />
          </button>
        </Link>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-4 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <Link href={`/${property.slug}`}>
                  <h3 className="font-semibold text-gray-900 text-base leading-snug group-hover:text-orange-500 transition-colors line-clamp-1">
                    {property.name}
                  </h3>
                </Link>
                <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <MapPin size={9} /> {property.address.neighborhood}, {property.address.city}
                </p>
              </div>
              <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-medium shrink-0', statusColors[property.status])}>
                {getStatusLabel(property.status)}
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 mt-2">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-gray-700">{rating}</span>
              <span className="text-xs text-gray-400">({reviews})</span>
              {property.has3DTour && (
                <span className="ml-2 flex items-center gap-0.5 text-[10px] text-blue-500 font-medium"><Box size={9} /> 3D</span>
              )}
              {property.hasVRTour && (
                <span className="ml-1 flex items-center gap-0.5 text-[10px] text-purple-500 font-medium"><Headset size={9} /> VR</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-4 text-xs text-gray-400 my-2.5">
              {bed && (
                <>
                  <span className="flex items-center gap-1"><BedDouble size={11} /> {bed.bedrooms === 0 ? 'Studio' : `${bed.bedrooms}`}</span>
                  <span className="flex items-center gap-1"><Bath size={11} /> {bed.bathrooms}</span>
                  <span className="flex items-center gap-1"><Maximize2 size={11} /> {bed.sqm}m²</span>
                </>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-base">{formatPrice(property.priceFrom, property.currency)}</span>
                <span className="text-xs text-gray-400 ml-1">from</span>
              </div>
              <Link href={`/${property.slug}`} className="rounded-full bg-gray-900 text-white text-xs px-4 py-1.5 hover:bg-gray-700 transition-colors">
                View →
              </Link>
            </div>
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
