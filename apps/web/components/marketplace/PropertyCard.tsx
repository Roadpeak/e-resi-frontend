'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { MapPin, BedDouble, Bath, Maximize2, Box, Headset, Heart, Film, MapPinned } from 'lucide-react';
import { useMemo } from 'react';
import type { Property } from '../../lib/types';
import { formatPrice, getStatusLabel, getStatusColor, cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/stores/auth.store';
import { useSavedProperties, useSaveProperty, useRemoveSavedProperty } from '../../lib/api/queries';

interface PropertyCardProps {
  property: Property;
  index?: number;
  view?: 'grid' | 'list';
  /** List view only — jumps the adjacent map to this property's pin. */
  onViewOnMap?: () => void;
}

/** Deterministic pick of up to 3 gallery images, distinct from the hero. */
function pickGalleryPreview(property: Property, count = 3) {
  const pool = property.galleryImages.filter((url) => url && url !== property.heroImageUrl);
  if (pool.length <= count) return pool;
  // Seed off the property id so the same card shows the same trio on every render.
  let seed = 0;
  for (let i = 0; i < property.id.length; i++) seed = (seed * 31 + property.id.charCodeAt(i)) >>> 0;
  const picked: string[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    let idx = seed % pool.length;
    while (used.has(idx)) idx = (idx + 1) % pool.length;
    used.add(idx);
    picked.push(pool[idx]);
  }
  return picked;
}

const statusColors: Record<string, string> = {
  ready: 'bg-green-100 text-green-700',
  off_plan: 'bg-orange-100 text-orange-600',
  under_construction: 'bg-yellow-100 text-yellow-700',
  sold_out: 'bg-gray-100 text-gray-500',
};

const isNew = (property: Property) => {
  if (property.isFeatured) return true;
  const created = new Date(property.createdAt).getTime();
  return !Number.isNaN(created) && Date.now() - created < 60 * 24 * 60 * 60 * 1000;
};

export function PropertyCard({ property, index = 0, view = 'grid', onViewOnMap }: PropertyCardProps) {
  const bed = property.floorPlans[0] ?? property.units[0];
  const galleryPreview = useMemo(() => pickGalleryPreview(property), [property]);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: savedList } = useSavedProperties();
  const saveMutation = useSaveProperty();
  const removeMutation = useRemoveSavedProperty();

  const saved = savedList?.some((s) => s.property.id === property.id) ?? false;
  const saving = saveMutation.isPending || removeMutation.isPending;

  function toggleSaved(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (saved) {
      removeMutation.mutate(property.slug);
    } else {
      saveMutation.mutate(property.slug);
    }
  }

  if (view === 'list') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="group relative flex gap-5 rounded-3xl bg-white p-4 shadow-sm shadow-gray-200/80 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200"
      >
        {/* Whole-card link */}
        <Link href={`/${property.slug}`} aria-label={property.name} className="absolute inset-0 z-[1] rounded-3xl" />

        {/* Image column: hero + 3-image gallery strip */}
        <div className="flex w-56 shrink-0 flex-col gap-1.5 sm:w-72">
          <div className="relative h-44 w-full overflow-hidden rounded-2xl sm:h-52">
            {property.heroImageUrl ? (
              <Image
                src={property.heroImageUrl}
                alt={property.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="288px"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-100" />
            )}
            {isNew(property) && (
              <span className="absolute left-2.5 top-2.5 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                New
              </span>
            )}
            <span className={cn('absolute bottom-2.5 left-2.5 rounded-full px-3 py-1 text-xs font-semibold', getStatusColor(property.status))}>
              {getStatusLabel(property.status)}
            </span>
          </div>

          {galleryPreview.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {galleryPreview.map((url, i) => (
                <div key={url + i} className="relative h-14 overflow-hidden rounded-lg sm:h-16">
                  <Image src={url} alt="" fill className="object-cover" sizes="96px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-semibold text-gray-900 transition-colors group-hover:text-brand-600">
                {property.name}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-gray-400">
                <MapPin size={14} className="shrink-0" />
                {property.address.street ? `${property.address.street}, ` : ''}
                {property.address.neighborhood}, {property.address.city}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                {formatPrice(property.priceFrom, property.currency)}
              </p>
              <p className="text-sm text-gray-400">from</p>
            </div>
          </div>

          {property.tagline && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
              {property.tagline}
            </p>
          )}

          {/* Tour badges + availability */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {property.has3DTour && (
              <span className="flex items-center gap-1 text-sm font-medium text-brand-600"><Box size={14} /> 3D</span>
            )}
            {property.hasVRTour && (
              <span className="flex items-center gap-1 text-sm font-medium text-purple-500"><Headset size={14} /> VR</span>
            )}
            {property.hasCinematicTour && (
              <span className="flex items-center gap-1 text-sm font-medium text-amber-600"><Film size={14} /> Cinematic</span>
            )}
            <span className="text-sm text-gray-400">
              · {property.availableUnits}/{property.totalUnits} units available
            </span>
          </div>

          {/* Bottom row: stat chips + actions */}
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              {bed && (
                <>
                  <StatChip icon={<BedDouble size={16} />} label={bed.bedrooms === 0 ? 'Studio' : `${bed.bedrooms}`} large />
                  <StatChip icon={<Bath size={16} />} label={`${bed.bathrooms}`} large />
                  <StatChip icon={<Maximize2 size={16} />} label={`${bed.sqm} m²`} large />
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {onViewOnMap && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewOnMap(); }}
                  className="relative z-10 flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-600 transition-colors hover:border-brand-300 hover:text-brand-600"
                >
                  <MapPinned size={16} /> View on map
                </button>
              )}
              <button
                onClick={toggleSaved}
                disabled={saving}
                aria-label={saved ? 'Remove from saved' : 'Save property'}
                className="relative z-10 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition-colors hover:border-red-300 hover:text-red-400 disabled:cursor-wait disabled:opacity-60"
              >
                <Heart size={18} className={cn(saved && 'fill-red-500 text-red-500')} />
              </button>
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
          onClick={toggleSaved}
          disabled={saving}
          aria-label={saved ? 'Remove from saved' : 'Save property'}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm text-gray-400 hover:text-red-400 transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60"
        >
          <Heart size={14} className={cn(saved && 'fill-red-500 text-red-500')} />
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
        {/* Price */}
        <div className="mb-1">
          <span className="font-bold text-gray-900 text-base">{formatPrice(property.priceFrom, property.currency)}</span>
          <span className="text-xs text-gray-400 ml-1">from</span>
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

function StatChip({ icon, label, large }: { icon: React.ReactNode; label: string; large?: boolean }) {
  return (
    <span
      className={cn(
        'flex items-center gap-1 rounded-lg bg-brand-50 font-medium text-brand-700',
        large ? 'gap-1.5 px-3 py-1.5 text-sm' : 'px-2 py-1 text-[11px]',
      )}
    >
      {icon} {label}
    </span>
  );
}
