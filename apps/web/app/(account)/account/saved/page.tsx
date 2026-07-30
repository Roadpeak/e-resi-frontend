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
        <Loader2 size={28} className="text-white/30 animate-spin" />
      </div>
    );
  }

  const items = saved ?? [];

  return (
    <div className="max-w-5xl space-y-6">
      <p className="text-sm text-white/40">{items.length} saved properties</p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <Heart size={32} className="mb-3 text-white/15" />
          <p className="text-sm font-medium text-white/50">No saved properties yet</p>
          <p className="text-xs text-white/25 mt-1">Browse properties and tap the heart icon to save them here.</p>
          <Link href="/properties" className="mt-5 rounded-xl border border-white/10 bg-surface-800 px-5 py-2.5 text-sm text-white/60 hover:text-white transition-colors">
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {items.map((item) => {
            const p = item.property;
            return (
              <div key={item.id} className="group overflow-hidden rounded-2xl border border-white/5 bg-surface-800 hover:border-white/10 transition-all">
                {/* Image */}
                <Link href={`/${p.slug}`} className="relative block overflow-hidden aspect-video">
                  <Image src={p.heroImageUrl} alt={p.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-900/60 to-transparent" />
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
                      <h3 className="font-semibold text-white hover:text-brand-300 transition-colors">{p.name}</h3>
                    </Link>
                    <div className="mt-1 flex items-center gap-1 text-xs text-white/40">
                      <MapPin size={11} /> {p.city}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <p className="text-base font-semibold text-white">{formatPrice(p.priceFrom, 'KES')}</p>
                    <Link href={`/${p.slug}`} className="rounded-xl bg-brand-600/15 border border-brand-500/20 px-3 py-1.5 text-xs font-medium text-brand-300 hover:bg-brand-600/25 transition-colors">
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
