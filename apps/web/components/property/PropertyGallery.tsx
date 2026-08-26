'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { StreetViewButtons } from './StreetViewButtons';
import { SectionHeading } from './SectionHeading';

interface Props {
  images: string[];
  name: string;
  /** Needed for Street View — without coordinates the button is not offered. */
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  /** Photographs of the surrounding area, uploaded by the developer. */
  areaPhotos?: { id: string; url: string; title?: string | null }[];
}

export function PropertyGallery({
  images, name, latitude, longitude, address, areaPhotos = [],
}: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const prev = () => setLightbox((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  const next = () => setLightbox((i) => (i === null ? null : (i + 1) % images.length));

  return (
    <section id="gallery" className="scroll-mt-24">
      <SectionHeading
        eyebrow="Gallery"
        title="Photography & Visuals"
        actions={
          /* The street outside and the area around it, alongside the building's
             own photography — a buyer asking what it is like there wants all
             three, and will not hunt for separate buttons to get them. */
          <StreetViewButtons
            propertyName={name}
            photos={images}
            areaPhotos={areaPhotos}
            latitude={latitude}
            longitude={longitude}
            address={address}
          />
        }
      />

      {/*
        Grid.

        Exactly five tiles: one large and four small. The count is fixed
        because the arrangement only resolves at five — the large tile spans
        two rows of the same grid, so the four small ones are what square its
        bottom edge off. Rendering every image instead (which is what
        `.slice(1)` used to do) left a ragged column whenever a development had
        six or more, *and* still drew a "+N" badge on the fourth, so the page
        showed five photographs and claimed one was hidden.

        Anything past the fifth lives in the lightbox, which is what the badge
        now points at.
      */}
      {/* grid-rows-2 only from md: below that the large tile keeps its own
          aspect and the four squares wrap beneath it in two columns. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
        {/* First image — large.
            No aspect ratio: it stretches to the two grid rows the small tiles
            define, so both columns end on exactly the same line whatever the
            container width. Pinning an aspect here is what left the ragged
            edge — the ratio only lines up at one viewport width. */}
        {images[0] && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="group relative col-span-2 aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl md:row-span-2 md:aspect-auto"
            onClick={() => setLightbox(0)}
          >
            <Image src={images[0]} alt={`${name} 1`} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        )}

        {/* The four that square off the block. */}
        {images.slice(1, 5).map((src, i) => {
          const isLastTile = i === 3;
          const hidden = images.length - 5;
          return (
            <motion.div
              key={src}
              whileHover={{ scale: 1.02 }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl aspect-square"
              onClick={() => setLightbox(i + 1)}
            >
              <Image src={src} alt={`${name} ${i + 2}`} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Only on the genuinely last tile, and only when photographs
                  really are hidden behind it. */}
              {isLastTile && hidden > 0 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 transition-colors group-hover:bg-black/70">
                  <span className="text-xl font-semibold text-white">+{hidden}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            {/* Close */}
            <button className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer" onClick={() => setLightbox(null)}>
              <X size={18} />
            </button>

            {/* Prev */}
            <button className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); prev(); }}>
              <ChevronLeft size={20} />
            </button>

            {/* Image */}
            <motion.div
              key={lightbox}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative h-[80vh] w-[90vw] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={images[lightbox]} alt={`${name} ${lightbox + 1}`} fill className="object-contain" sizes="90vw" />
            </motion.div>

            {/* Next */}
            <button className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); next(); }}>
              <ChevronRight size={20} />
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/40">
              {lightbox + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
