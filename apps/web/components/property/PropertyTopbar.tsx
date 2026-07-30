'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-surface-950/90 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent',
        )}
      >
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">

          {/* ── Left: back + property identity ── */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/properties"
              className="group flex items-center gap-1.5 text-white/30 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">e-resi</span>
            </Link>

            <ChevronRight size={13} className="text-white/15 hidden sm:block" />

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
                  {/* Mini logo badge — unique per property */}
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white text-[10px] font-bold shrink-0', accent)}>
                    {property.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-white hidden md:block truncate max-w-48">
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
                  'relative rounded-lg px-3.5 py-2 text-sm font-medium transition-all cursor-pointer whitespace-nowrap',
                  active === section.id
                    ? 'text-white'
                    : 'text-white/35 hover:text-white/70',
                )}
              >
                {section.label}
                {active === section.id && (
                  <motion.span
                    layoutId="property-nav-indicator"
                    className="absolute inset-0 rounded-lg bg-white/8"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* ── Right: actions ── */}
          <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
            {/* Tour pills */}
            {property.hasCinematicTour && (
              <Link
                href={`/${property.slug}/tour/cinematic`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-warm-500/25 bg-warm-500/10 px-3 py-1.5 text-xs font-medium text-warm-300 hover:bg-warm-500/20 transition-colors"
              >
                <Film size={13} /> Cinematic
              </Link>
            )}
            {property.hasVRTour && (
              <Link
                href={`/${property.slug}/tour/vr`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors"
              >
                <Headset size={13} /> VR Tour
              </Link>
            )}
            {property.has3DTour && (
              <Link
                href={`/${property.slug}/tour/3d`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-brand-500/25 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300 hover:bg-brand-500/20 transition-colors"
              >
                <Box size={13} /> 3D Tour
              </Link>
            )}

            {/* Save */}
            <button
              onClick={() => setSaved((v) => !v)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer',
                saved
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : 'border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10',
              )}
            >
              <Heart size={15} className={saved ? 'fill-red-400' : ''} />
            </button>

            {/* Share */}
            <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
              <Share2 size={15} />
            </button>

            {/* Book CTA */}
            <div className="hidden sm:block">
              <Button size="sm" onClick={() => scrollTo('booking')}>Book a Viewing</Button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer"
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
            className="fixed inset-x-0 top-16 z-40 border-b border-white/5 bg-surface-950/95 backdrop-blur-xl pb-5 pt-3 px-4 lg:hidden"
          >
            {/* Property identity on mobile */}
            <div className="mb-4 flex items-center gap-3 border-b border-white/5 pb-4">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white text-xs font-bold', accent)}>
                {property.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{property.name}</p>
                <p className="text-xs text-white/40">{property.address.neighborhood}, {property.address.city}</p>
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
                        ? 'bg-white/8 text-white'
                        : 'text-white/50 hover:text-white hover:bg-white/5',
                    )}
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-white/5 pt-4 flex gap-2">
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
