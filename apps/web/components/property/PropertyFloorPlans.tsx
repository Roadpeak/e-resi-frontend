'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { BedDouble, Bath, Maximize2 } from 'lucide-react';
import type { FloorPlan } from '../../lib/types';
import { cn } from '../../lib/utils';

interface Props { floorPlans: FloorPlan[] }

export function PropertyFloorPlans({ floorPlans }: Props) {
  const [active, setActive] = useState(0);
  const plan = floorPlans[active];

  if (!floorPlans.length) return null;

  return (
    <section id="floorplans" className="scroll-mt-24">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-brand-400">Layouts</p>
      <h2 className="mb-8 text-3xl font-semibold text-white">Floor Plans</h2>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Plan selector */}
        <div className="flex flex-col gap-3">
          {floorPlans.map((fp, i) => (
            <button
              key={fp.id}
              onClick={() => setActive(i)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-2xl border p-5 text-left transition-all cursor-pointer',
                active === i
                  ? 'border-brand-500/40 bg-brand-500/10'
                  : 'border-white/5 bg-surface-800 hover:border-white/10',
              )}
            >
              <span className="font-medium text-white">{fp.name}</span>
              <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                <span className="flex items-center gap-1"><BedDouble size={12} />{fp.bedrooms === 0 ? 'Studio' : `${fp.bedrooms} Bed`}</span>
                <span className="flex items-center gap-1"><Bath size={12} />{fp.bathrooms} Bath</span>
                <span className="flex items-center gap-1"><Maximize2 size={12} />{fp.sqm} sqm</span>
              </div>
            </button>
          ))}
        </div>

        {/* Plan image */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="relative overflow-hidden rounded-3xl border border-white/5 bg-surface-800"
              style={{ aspectRatio: '4/3' }}
            >
              {plan.imageUrl ? (
                <Image
                  src={plan.imageUrl}
                  alt={plan.name}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white/20 text-sm">No floor plan image</div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Specs bar */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Bedrooms', value: plan.bedrooms === 0 ? 'Studio' : plan.bedrooms },
              { label: 'Bathrooms', value: plan.bathrooms },
              { label: 'Floor Area', value: `${plan.sqm} sqm` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white/5 bg-surface-800 px-4 py-3 text-center">
                <p className="text-lg font-semibold text-white">{value}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
