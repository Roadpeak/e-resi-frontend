'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Headset, Box, Share2, Heart, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Property } from '../../lib/types';
import { formatPriceRange, getStatusLabel, getStatusColor, cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface Props { property: Property }

export function PropertyHero({ property }: Props) {
  const [saved, setSaved] = useState(false);

  return (
    <section className="relative min-h-screen flex flex-col justify-end overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={property.heroImageUrl}
          alt={property.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Layered gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/50 to-surface-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-950/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-32">
        <div className="max-w-3xl">
          {/* Status + developer */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-5 flex items-center gap-3 flex-wrap"
          >
            <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', getStatusColor(property.status))}>
              {getStatusLabel(property.status)}
            </span>
            <span className="text-sm text-white/40">by {property.developer.name}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            {property.name}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 text-xl text-white/50"
          >
            {property.tagline}
          </motion.p>

          {/* Location + price row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 flex items-center gap-6 flex-wrap"
          >
            <span className="flex items-center gap-1.5 text-white/50">
              <MapPin size={15} className="text-brand-400" />
              {property.address.neighborhood}, {property.address.city}
            </span>
            <span className="h-4 w-px bg-white/10" />
            <div>
              <span className="text-xs text-white/40">From </span>
              <span className="text-lg font-semibold text-white">
                {formatPriceRange(property.priceFrom, property.priceTo, property.currency)}
              </span>
            </div>
            {property.completionDate && (
              <>
                <span className="h-4 w-px bg-white/10" />
                <span className="text-sm text-white/40">
                  Est. completion {new Date(property.completionDate).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
                </span>
              </>
            )}
          </motion.div>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 flex items-center gap-3 flex-wrap"
          >
            {property.hasVRTour && (
              <Button href={`/${property.slug}/tour/vr`} size="lg" icon={<Headset size={18} />}>
                Enter VR Tour
              </Button>
            )}
            {property.has3DTour && (
              <Button href={`/${property.slug}/tour/3d`} variant="secondary" size="lg" icon={<Box size={18} />}>
                3D Walkthrough
              </Button>
            )}
            <a href="#booking">
              <Button variant="outline" size="lg">
                Book a Viewing
              </Button>
            </a>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setSaved((v) => !v)}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl border transition-all cursor-pointer',
                  saved
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10',
                )}
              >
                <Heart size={18} className={saved ? 'fill-red-400' : ''} />
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                <Share2 size={18} />
              </button>
            </div>
          </motion.div>

          {/* Immersive feature tags */}
          {(property.has3DTour || property.hasVRTour || property.hasDigitalTwin) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 flex gap-2 flex-wrap"
            >
              {property.has3DTour && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs text-brand-300">
                  <Box size={11} /> Interactive 3D Model
                </span>
              )}
              {property.hasVRTour && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                  <Headset size={11} /> Virtual Reality Tour
                </span>
              )}
              {property.hasDigitalTwin && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  ✦ Digital Twin
                </span>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 right-8 z-10 flex items-center gap-2 text-white/20 text-xs"
      >
        <span>Scroll to explore</span>
        <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <ChevronDown size={14} />
        </motion.div>
      </motion.div>
    </section>
  );
}
