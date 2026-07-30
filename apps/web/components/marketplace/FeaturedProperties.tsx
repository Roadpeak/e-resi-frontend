'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PropertyCard } from './PropertyCard';
import { useProperties } from '../../lib/api/queries';

export function FeaturedProperties() {
  const { data } = useProperties({ limit: 6 });
  const properties = data?.items ?? [];

  if (properties.length === 0) return null;

  return (
    <section id="featured" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-brand-400">
              Premium Developments
            </p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              Featured Properties
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link
              href="/properties"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors group"
            >
              View all properties
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {properties.map((property, i) => (
            <PropertyCard key={property.id} property={property} index={i} />
          ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            View all properties <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
