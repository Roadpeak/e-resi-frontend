'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, Loader2 } from 'lucide-react';
import { formatPrice, getStatusLabel, getStatusColor, cn } from '../../../../lib/utils';
import { useSavedProperties, useRemoveSavedProperty } from '../../../../lib/api/queries';

export default function AccountSaved() {
  const { data: saved, isLoading } = useSavedProperties();
  const remove = useRemoveSavedProperty();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="text-gray-400 animate-spin" />
      </div>
    );
  }

  const items = saved ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-normal text-[#202124]">Saved properties</h1>
        <p className="text-sm text-gray-500">
          {items.length} propert{items.length === 1 ? 'y' : 'ies'} you&rsquo;ve saved to compare and come back to.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-20 text-center">
          <Heart size={32} className="mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No saved properties yet</p>
          <p className="text-xs text-gray-400 mt-1">Browse properties and tap the heart icon to save them here.</p>
          <Link href="/properties" className="mt-5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Browse Properties
          </Link>
        </div>
      ) : (
        /* Compact cards earn four columns on a big monitor — one long
           left-hugging column was the old cap talking, not the content. */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => {
            const p = item.property;
            return (
              <div key={item.id} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-all">
                {/* Image */}
                <Link href={`/${p.slug}`} className="relative block overflow-hidden aspect-video">
                  <Image src={p.heroImageUrl} alt={p.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1536px) 33vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className={cn('absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium', getStatusColor(p.status))}>
                    {getStatusLabel(p.status)}
                  </span>
                  {/* Remove saved */}
                  <button
                    onClick={(e) => { e.preventDefault(); remove.mutate(p.slug); }}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-red-400 hover:bg-black/50 transition-colors cursor-pointer"
                  >
                    <Heart size={14} className="fill-red-400" />
                  </button>
                </Link>

                {/* Info */}
                <div className="p-5 space-y-3">
                  <div>
                    <Link href={`/${p.slug}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">{p.name}</h3>
                    </Link>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={11} /> {p.city}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <p className="text-base font-semibold text-gray-900">{formatPrice(p.priceFrom, 'KES')}</p>
                    <Link href={`/${p.slug}`} className="rounded-xl bg-brand-50 border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors">
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
