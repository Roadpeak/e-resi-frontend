'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BedDouble, Bath, Maximize2, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import type { Unit } from '../../lib/types';
import { formatPrice, cn } from '../../lib/utils';

interface Props {
  units: Unit[];
  currency: string;
  propertySlug: string;
}

const statusConfig = {
  available: { label: 'Available', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  reserved: { label: 'Reserved', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-400/10 border-amber-400/20' },
  sold: { label: 'Sold', icon: XCircle, color: 'text-red-600', bg: 'bg-red-400/10 border-red-400/20' },
};

type Filter = 'all' | 'available';

export function PropertyUnits({ units, currency, propertySlug }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const displayed = filter === 'available' ? units.filter((u) => u.status?.toLowerCase() === 'available') : units;

  return (
    <section id="units" className="scroll-mt-24">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-brand-400">Availability</p>
          <h2 className="text-3xl font-semibold text-gray-900">Units & Pricing</h2>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 p-1">
          {(['all', 'available'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all cursor-pointer',
                filter === f ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900',
              )}
            >
              {f === 'all' ? `All (${units.length})` : `Available (${units.filter((u) => u.status?.toLowerCase() === 'available').length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayed.map((unit, i) => {
          const statusKey = unit.status?.toLowerCase() as keyof typeof statusConfig;
          const config = statusConfig[statusKey] ?? statusConfig.available;
          const Icon = config.icon;
          const isAvailable = statusKey === 'available';

          return (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={cn(
                'group relative rounded-2xl border bg-white p-6 flex flex-col gap-4 transition-all',
                isAvailable
                  ? 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                  : 'border-gray-200 opacity-60 hover:opacity-80',
              )}
            >
              {/* whole card opens the unit view */}
              <Link
                href={`/${propertySlug}/units/${unit.id}`}
                aria-label={`View ${unit.name}`}
                className="absolute inset-0 z-0 rounded-2xl"
              />
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{unit.name}</p>
                  <p className="text-sm text-gray-500">Floor {unit.floor}</p>
                </div>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', config.bg, config.color)}>
                  <Icon size={11} />
                  {config.label}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><BedDouble size={13} />{unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} Bed`}</span>
                <span className="flex items-center gap-1"><Bath size={13} />{unit.bathrooms} Bath</span>
                <span className="flex items-center gap-1"><Maximize2 size={13} />{unit.sqm} sqm</span>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5">
                {unit.features.map((f) => (
                  <span key={f} className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{f}</span>
                ))}
              </div>

              {/* Price + CTA */}
              <div className="relative z-10 mt-auto flex items-center justify-between border-t border-gray-200 pt-2 pointer-events-none">
                <div>
                  <p className="text-xs text-gray-400">Price</p>
                  <p className="text-lg font-semibold text-gray-900">{formatPrice(unit.price, currency)}</p>
                </div>
                <Link
                  href={`/${propertySlug}/units/${unit.id}`}
                  className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
                >
                  View unit <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
