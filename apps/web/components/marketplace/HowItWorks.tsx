'use client';

import { motion } from 'framer-motion';
import { Search, Headset, CalendarCheck, KeyRound } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Discover',
    description: 'Browse curated developments. Filter by location, price, category, or technology.',
  },
  {
    number: '02',
    icon: Headset,
    title: 'Explore Immersively',
    description: 'Watch cinematic videos, walk through 3D models, and enter full virtual reality.',
  },
  {
    number: '03',
    icon: CalendarCheck,
    title: 'Book a Viewing',
    description: 'Schedule a virtual or physical tour directly through the platform.',
  },
  {
    number: '04',
    icon: KeyRound,
    title: 'Reserve & Buy',
    description: 'Reserve a unit, review documents, and complete your purchase with confidence.',
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-950/20 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-brand-400">
            The buyer journey
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            From discovery to keys
          </h2>
        </motion.div>

        <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connecting line (desktop) */}
          <div className="absolute top-10 left-1/4 right-1/4 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step number + icon */}
                <div className="relative mb-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-surface-800">
                    <Icon size={28} className="text-brand-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                    {step.number.replace('0', '')}
                  </span>
                </div>

                <h3 className="mb-2 font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-48">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
