'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import type { ConstructionUpdate } from '../../lib/types';
import { SectionHeading } from './SectionHeading';
import { formatDate } from '../../lib/utils';

interface Props { updates: ConstructionUpdate[] }

export function PropertyConstruction({ updates }: Props) {
  const latest = updates[updates.length - 1];

  return (
    <section id="construction" className="scroll-mt-24">
      <SectionHeading
        eyebrow="Construction"
        title="Development Progress"
        actions={
          <div className="text-right">
            <p className="text-[32px] font-medium leading-none tracking-[-0.02em] text-gray-900">
              {latest?.percentComplete}%
            </p>
            <p className="mt-1.5 text-[12px] text-gray-500">Overall completion</p>
          </div>
        }
      />

      {/* Progress bar */}
      <div className="mb-12 h-2 overflow-hidden rounded-full bg-gray-200">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${latest?.percentComplete ?? 0}%` }}
          // amount: 0 — a default threshold silently skips the animation for a
          // bar that is already in view, which showed a 100% development as an
          // empty track.
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
        />
      </div>

      {/* Timeline */}
      <div className="relative space-y-8 pl-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
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

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-3 flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-gray-900">{update.title}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={11} /> {formatDate(update.date)}
                </span>
                <span className="ml-auto text-xs font-medium text-brand-400">{update.percentComplete}% complete</span>
              </div>
              <p className="text-sm text-gray-500">{update.description}</p>

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
