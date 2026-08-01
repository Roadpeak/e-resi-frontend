'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface Props {
  images: string[];
  name: string;
}

export function PropertyGallery({ images, name }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const prev = () => setLightbox((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  const next = () => setLightbox((i) => (i === null ? null : (i + 1) % images.length));

  return (
    <section id="gallery" className="scroll-mt-24">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-brand-400">Gallery</p>
      <h2 className="mb-8 text-3xl font-semibold text-gray-900">Photography & Visuals</h2>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* First image — large */}
        {images[0] && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="group relative col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-2xl aspect-[4/3]"
            onClick={() => setLightbox(0)}
          >
            <Image src={images[0]} alt={`${name} 1`} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        )}

        {/* Remaining images */}
        {images.slice(1).map((src, i) => (
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
            {/* "more" overlay on last visible if there are extra */}
            {i === 2 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                <span className="text-xl font-semibold text-white">+{images.length - 4}</span>
              </div>
            )}
          </motion.div>
        ))}
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
