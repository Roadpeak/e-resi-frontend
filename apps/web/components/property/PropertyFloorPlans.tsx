'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { BedDouble, Bath, Maximize2 } from 'lucide-react';
import type { FloorPlan } from '../../lib/types';
import { SectionHeading } from './SectionHeading';
import { cn } from '../../lib/utils';

interface Props { floorPlans: FloorPlan[] }

export function PropertyFloorPlans({ floorPlans }: Props) {
  const [active, setActive] = useState(0);
  const plan = floorPlans[active];

  if (!floorPlans.length) return null;

  return (
    <section id="floorplans" className="scroll-mt-24">
      <SectionHeading eyebrow="Layouts" title="Floor Plans" />

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
                  : 'border-gray-200 bg-white hover:border-gray-300',
              )}
            >
              <span className="font-medium text-gray-900">{fp.name}</span>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
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
              className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white"
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
                <div className="flex h-full items-center justify-center text-gray-400 text-sm">No floor plan image</div>
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
              <div key={label} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center">
                <p className="text-lg font-semibold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
