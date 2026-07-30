'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useInView } from 'framer-motion';

const stats = [
  { value: '240+', label: 'Properties Listed' },
  { value: '18K+', label: 'VR Tours Taken' },
  { value: '95%', label: 'Buyer Satisfaction' },
  { value: '42+', label: 'Developers Onboard' },
];

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div
      ref={ref}
      className="border-y border-white/5 bg-surface-900/50 backdrop-blur-sm py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <p className="text-3xl font-semibold text-white sm:text-4xl">{stat.value}</p>
              <p className="mt-1 text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
