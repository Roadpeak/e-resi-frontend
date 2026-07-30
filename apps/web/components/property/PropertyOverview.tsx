'use client';

import { motion } from 'framer-motion';
import { Building2, Users, Calendar, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import type { Property } from '../../lib/types';
import { pluralize } from '../../lib/utils';

interface Props { property: Property }

export function PropertyOverview({ property }: Props) {
  const stats = [
    { icon: Building2, label: 'Total Units', value: (property.totalUnits ?? 0).toString() },
    { icon: Users, label: 'Available', value: (property.availableUnits ?? 0).toString() },
    { icon: Calendar, label: 'Completion', value: property.completionDate ? new Date(property.completionDate).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }) : 'Ready' },
    { icon: CheckCircle2, label: 'Bedrooms', value: (() => { const fp = property.floorPlans ?? []; return `${fp[0]?.bedrooms ?? 0}–${fp[fp.length - 1]?.bedrooms ?? 0}`; })() },
  ];

  return (
    <section id="overview" className="scroll-mt-24">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
        {/* Left: text */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-brand-400">Overview</p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">About this development</h2>
          <p className="mt-5 text-white/50 leading-relaxed text-lg">{property.description}</p>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-2">
            {(property.features ?? []).map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-sm text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                {feat}
              </div>
            ))}
          </div>

          {/* Developer card */}
          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/5 bg-surface-800 p-4">
            <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-700">
              {property.developer?.logoUrl && (
                <Image src={property.developer.logoUrl} alt={property.developer.name ?? ''} fill className="object-contain p-2" />
              )}
            </div>
            <div>
              <p className="font-medium text-white">{property.developer?.name ?? '—'}</p>
              <p className="text-sm text-white/40">
                {property.developer?.establishedYear ? `Est. ${property.developer.establishedYear} · ` : ''}{pluralize(property.developer?.completedProjects ?? 0, 'project')} completed
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right: stat cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 gap-4 content-start"
        >
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-white/5 bg-surface-800 p-6">
              <Icon size={20} className="text-brand-400 mb-3" />
              <p className="text-2xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-sm text-white/40">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
