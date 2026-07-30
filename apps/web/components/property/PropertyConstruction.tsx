'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import type { ConstructionUpdate } from '../../lib/types';
import { formatDate } from '../../lib/utils';

interface Props { updates: ConstructionUpdate[] }

export function PropertyConstruction({ updates }: Props) {
  const latest = updates[updates.length - 1];

  return (
    <section id="construction" className="scroll-mt-24">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-brand-400">Construction</p>
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-3xl font-semibold text-white">Development Progress</h2>
        <div className="text-right">
          <p className="text-3xl font-semibold text-white">{latest?.percentComplete}%</p>
          <p className="text-xs text-white/40">Overall completion</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-12 h-2 overflow-hidden rounded-full bg-surface-700">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${latest?.percentComplete ?? 0}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
        />
      </div>

      {/* Timeline */}
      <div className="relative space-y-8 pl-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
        {[...updates].reverse().map((update, i) => (
          <motion.div
            key={update.id}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="relative"
          >
            {/* Dot */}
            <span className="absolute -left-[25px] top-1.5 flex h-3 w-3 items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
            </span>

            <div className="rounded-2xl border border-white/5 bg-surface-800 p-6">
              <div className="mb-3 flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-white">{update.title}</span>
                <span className="flex items-center gap-1 text-xs text-white/30">
                  <Calendar size={11} /> {formatDate(update.date)}
                </span>
                <span className="ml-auto text-xs font-medium text-brand-400">{update.percentComplete}% complete</span>
              </div>
              <p className="text-sm text-white/50">{update.description}</p>

              {update.images.length > 0 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {update.images.map((img, j) => (
                    <div key={j} className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl">
                      <Image src={img} alt={update.title} fill className="object-cover" sizes="144px" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
