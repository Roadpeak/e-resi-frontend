'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Headset, Box, Heart, Share2, Menu, X, ChevronRight, Film,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Property } from '../../lib/types';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../lib/stores/auth.store';
import { useSavedProperties, useSaveProperty, useRemoveSavedProperty } from '../../lib/api/queries';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'viewer3d', label: '3D Tour' },
  { id: 'floorplans', label: 'Floor Plans' },
  { id: 'units', label: 'Units' },
  { id: 'location', label: 'Location' },
  { id: 'construction', label: 'Progress' },
  { id: 'booking', label: 'Book a Viewing' }, // overridden by ctaLabel at render
];

interface Props {
  property: Property;
  /** Primary call to action wording, chosen by the developer. */
  ctaLabel?: string;
}

export function PropertyTopbar({ property, ctaLabel = 'Book a Viewing' }: Props) {
  // The developer's uploaded logo, stored as a media row with a sentinel title.
  const logoUrl = property.logoUrl;
  const [scrolled, setScrolled] = useState(false);
  /**
   * Whether this visitor reached the page from our marketplace, rather than
   * from a link the developer shared. Only the former gets a way back: see
   * the topbar comment on why we do not offer the latter an exit.
   */
  const [cameFromMarketplace, setCameFromMarketplace] = useState(false);
  const [active, setActive] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: savedList } = useSavedProperties();
  const saveMutation = useSaveProperty();
  const removeMutation = useRemoveSavedProperty();
  const saved = savedList?.some((s) => s.property.id === property.id) ?? false;
  const savingToggle = saveMutation.isPending || removeMutation.isPending;

  function toggleSaved() {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (saved) {
      removeMutation.mutate(property.slug);
    } else {
      saveMutation.mutate(property.slug);
    }
  }

  const visible = sections
    // The booking section's label follows whatever the developer called their
    // call to action, so nav and button never disagree.
    .map((s) => (s.id === 'booking' ? { ...s, label: ctaLabel } : s))
    .filter((s) => {
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

  // The brand accent comes from the theme wrapper as CSS custom properties,
  // so the topbar inherits whatever the developer chose without prop-drilling.
  // (This replaced a per-category hue map, which gave every apartment
  // development in the country the identical gradient.)

  // Own the browser tab too — a shared link that says "e-resi" in the tab
  // reads as someone else's site no matter how the page itself is branded.
  useEffect(() => {
    const previous = document.title;
    document.title = property.tagline
      ? `${property.name} — ${property.tagline}`
      : property.name;
    return () => { document.title = previous; };
  }, [property.name, property.tagline]);

  useEffect(() => {
    // Same-origin referrer means they were browsing us already. document
    // .referrer is empty for a WhatsApp/direct open, which is exactly the
    // cold-arrival case we want to treat as the developer's own traffic.
    try {
      const ref = document.referrer;
      if (!ref) return;
      const url = new URL(ref);
      if (url.origin === window.location.origin && !url.pathname.startsWith(`/${property.slug}`)) {
        setCameFromMarketplace(true);
      }
    } catch {
      // A malformed referrer simply means we show no back link.
    }
  }, [property.slug]);

  // Where the branded wordmark links: the development's own top, not our
  // marketplace home.
  const homeHref = `/${property.slug}`;

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/85 backdrop-blur-xl',
          scrolled ? 'border-b border-gray-200 shadow-sm' : 'border-b border-gray-100',
        )}
      >
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">

          {/* ── Left: the developer's identity, always ──
              This corner is the highest-status position on the page, so it
              belongs to the development — not to us. Someone arriving from a
              shared WhatsApp link should read this as the developer's own
              site; our attribution lives in the footer instead. */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href={homeHref} className="flex items-center gap-2.5 min-w-0" aria-label={property.name}>
              {logoUrl ? (
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                  <Image
                    src={logoUrl}
                    alt={`${property.name} logo`}
                    fill
                    className="object-contain p-0.5"
                    sizes="36px"
                  />
                </span>
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold shrink-0"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-on)' }}
                >
                  {property.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <span
                className="text-[15px] font-semibold text-gray-900 truncate max-w-[10rem] sm:max-w-xs"
                style={{ fontFamily: 'var(--brand-font-heading)' }}
              >
                {property.name}
              </span>
            </Link>

            {/* Back to the marketplace only for visitors who came from it. A
                cold arrival from a shared link is the developer's own traffic;
                offering them an exit to a marketplace of rival developments
                would be actively against the developer's interest. */}
            <AnimatePresence>
              {cameFromMarketplace && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="hidden sm:flex items-center gap-1"
                >
                  <ChevronRight size={13} className="text-gray-300" />
                  <Link
                    href="/properties"
                    className="group flex items-center gap-1 text-[13px] text-gray-400 transition-colors hover:text-gray-700"
                  >
                    <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
                    All properties
                  </Link>
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
              onClick={toggleSaved}
              disabled={savingToggle}
              aria-label={saved ? 'Remove from saved' : 'Save property'}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer disabled:cursor-wait disabled:opacity-60',
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
              className="hidden sm:inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-on)' }}
            >
              {ctaLabel}
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
              {logoUrl ? (
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                  <Image src={logoUrl} alt="" fill className="object-contain p-0.5" sizes="40px" />
                </span>
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-on)' }}
                >
                  {property.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
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
                {ctaLabel}
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
