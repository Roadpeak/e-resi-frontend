'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Headset, Box, Heart, Share2, Menu, X, ChevronRight, Film,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Property } from '../../lib/types';
import { Button } from '../ui/Button';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'viewer3d', label: '3D Tour' },
  { id: 'floorplans', label: 'Floor Plans' },
  { id: 'units', label: 'Units' },
  { id: 'location', label: 'Location' },
  { id: 'construction', label: 'Progress' },
  { id: 'booking', label: 'Book a Viewing' },
];

interface Props {
  property: Property;
}

export function PropertyTopbar({ property }: Props) {
  // The developer's uploaded logo, stored as a media row with a sentinel title.
  const logoUrl = property.logoUrl;
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const [saved, setSaved] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visible = sections.filter((s) => {
    if (s.id === 'cinematic' && !property.hasCinematicTour) return false;
    if (s.id === 'viewer3d' && !property.has3DTour) return false;
    if (s.id === 'construction' && property.constructionUpdates.length === 0) return false;
    return true;
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    visible.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [visible]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  // Derive a subtle accent from the property — in production you'd store a brand color per property
  // For now we use different hues based on category
  const accentMap: Record<string, string> = {
    residential: 'from-brand-600 to-brand-800',
    commercial: 'from-emerald-700 to-emerald-900',
    mixed_use: 'from-violet-700 to-violet-900',
    land: 'from-amber-700 to-amber-900',
  };
  const accent = accentMap[property.category] ?? accentMap.residential;

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/85 backdrop-blur-xl',
          scrolled ? 'border-b border-gray-200 shadow-sm' : 'border-b border-gray-100',
        )}
      >
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">

          {/* ── Left: back + property identity ── */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/properties"
              className="group flex items-center gap-1.5 transition-colors text-sm text-gray-400 hover:text-gray-900"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline font-semibold text-gray-900">e-resi</span>
            </Link>

            <ChevronRight size={13} className="hidden sm:block text-gray-300" />

            {/* Property wordmark */}
            <AnimatePresence>
              {scrolled && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  {/* Mini logo badge — the developer's uploaded logo, else initials */}
                  {logoUrl ? (
                    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                      <Image
                        src={logoUrl}
                        alt={`${property.name} logo`}
                        fill
                        className="object-contain p-0.5"
                        sizes="28px"
                      />
                    </span>
                  ) : (
                    <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white text-[10px] font-bold shrink-0', accent)}>
                      {property.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-900 hidden md:block truncate max-w-48">
                    {property.name}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Center: section nav (desktop) ── */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-0.5">
            {visible.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                className={cn(
                  'relative rounded-full px-3.5 py-2 text-sm font-medium transition-all cursor-pointer whitespace-nowrap',
                  active === section.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900',
                )}
              >
                {/* Pill sits behind the label — it's absolute and later in DOM order,
                    so without explicit layering it paints over the text. */}
                {active === section.id && (
                  <motion.span
                    layoutId="property-nav-indicator"
                    className="absolute inset-0 -z-10 rounded-full bg-gray-100"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                  />
                )}
                <span className="relative z-10">{section.label}</span>
              </button>
            ))}
          </nav>

          {/* ── Right: actions ── */}
          <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
            {/* Tour pills */}
            {property.hasCinematicTour && (
              <Link
                href={`/${property.slug}/tour/cinematic`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-warm-500/25 bg-warm-500/10 px-3 py-1.5 text-xs font-medium text-warm-700 hover:bg-warm-500/20 transition-colors"
              >
                <Film size={13} /> Cinematic
              </Link>
            )}
            {property.hasVRTour && (
              <Link
                href={`/${property.slug}/tour/vr`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-500/20 transition-colors"
              >
                <Headset size={13} /> VR Tour
              </Link>
            )}
            {property.has3DTour && (
              <Link
                href={`/${property.slug}/tour/3d`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-500/20 transition-colors"
              >
                <Box size={13} /> 3D Tour
              </Link>
            )}

            {/* Save */}
            <button
              onClick={() => setSaved((v) => !v)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer',
                saved
                  ? 'border-red-500/30 bg-red-500/10 text-red-500'
                  : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100',
              )}
            >
              <Heart size={15} className={saved ? 'fill-red-500' : ''} />
            </button>

            {/* Share */}
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer">
              <Share2 size={15} />
            </button>

            {/* Book CTA */}
            <button
              onClick={() => scrollTo('booking')}
              className="hidden sm:inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Book a Viewing
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile nav drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-xl pb-5 pt-3 px-4 lg:hidden"
          >
            {/* Property identity on mobile */}
            <div className="mb-4 flex items-center gap-3 border-b border-gray-200 pb-4">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white text-xs font-bold', accent)}>
                {property.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{property.name}</p>
                <p className="text-xs text-gray-500">{property.address.neighborhood}, {property.address.city}</p>
              </div>
            </div>

            <ul className="space-y-0.5">
              {visible.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollTo(section.id)}
                    className={cn(
                      'block w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors cursor-pointer',
                      active === section.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
                    )}
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-gray-200 pt-4 flex gap-2">
              <Button size="md" className="flex-1" onClick={() => scrollTo('booking')}>
                Book a Viewing
              </Button>
              {property.hasVRTour && (
                <Button href={`/${property.slug}/tour/vr`} variant="secondary" size="md" icon={<Headset size={15} />} className="flex-1">
                  VR Tour
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
