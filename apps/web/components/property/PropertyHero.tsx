'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Box, Headset, Sparkles } from 'lucide-react';
import type { Property } from '../../lib/types';
import { getStatusLabel, getStatusColor, cn } from '../../lib/utils';

interface Props { property: Property }

export function PropertyHero({ property }: Props) {
  return (
    <section className="relative bg-white pt-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-[52vh] min-h-[400px] w-full overflow-hidden lg:h-[66vh]"
      >
        {/* Media */}
        {property.heroVideoUrl ? (
          <video
            src={property.heroVideoUrl}
            poster={property.heroImageUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={property.heroImageUrl}
            alt={property.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}

        {/* Soft scrim under the navbar so it stays legible over the photo */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 via-white/20 to-transparent" />

        {/* Signature bottom fade-to-white */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white via-white/70 to-transparent lg:h-60" />

        {/* Status + developer — overlaid top-left */}
        <div className="absolute inset-x-0 top-6 z-10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2.5 px-4 sm:px-6 lg:px-8">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm', getStatusColor(property.status))}
            >
              {getStatusLabel(property.status)}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="rounded-full bg-gray-900/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
            >
              by {property.developer.name}
            </motion.span>
          </div>
        </div>

        {/* Immersive capability tags — overlaid above the fade */}
        {(property.has3DTour || property.hasVRTour || property.hasDigitalTwin) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="absolute inset-x-0 bottom-8 z-10"
          >
            <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 sm:px-6 lg:px-8">
              {property.has3DTour && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <Box size={11} /> Interactive 3D Model
                </span>
              )}
              {property.hasVRTour && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <Headset size={11} /> Virtual Reality Tour
                </span>
              )}
              {property.hasDigitalTwin && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <Sparkles size={11} /> Digital Twin
                </span>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
