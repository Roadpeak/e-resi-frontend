'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Heart, Menu, Share2, Sparkles, X } from 'lucide-react';
import type { Property } from '../../../../lib/types';
import { useAuthStore } from '../../../../lib/stores/auth.store';
import { useRemoveSavedProperty, useSaveProperty, useSavedProperties } from '../../../../lib/api/queries';
import { track } from '../../../../lib/analytics/track';
import { PropertyMonogram } from '../../PropertyMonogram';

/**
 * Headers for the studio templates — each drawn the way its reference draws
 * its own, rather than all seven wearing the shared bar:
 *
 *  frame     white strip, links split either side of a bold centred wordmark
 *  prestige  transparent over the film, centred links, pill button; white on scroll
 *  gallery   inside the rounded hero: italic wordmark, centred links, round menu button
 *  atelier   spaced capitals, a centred "Menu", a hairline box button
 *  horizon   inside the rounded hero: sparkle wordmark left, links right
 *  skyline   white bar, plain wordmark, underlined active link, square outline button
 *  noir      heavy italic wordmark, links stacked top-right over the hero
 *
 * Behaviour is shared: section links that exist, save, share (with
 * telemetry), the tab title, and a full-screen menu on small screens.
 */
export type StudioNavVariant = 'frame' | 'prestige' | 'gallery' | 'atelier' | 'horizon' | 'skyline' | 'noir';

interface Link { id: string; label: string }

function useNav(property: Property) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const [note, setNote] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: savedList } = useSavedProperties();
  const save = useSaveProperty();
  const remove = useRemoveSavedProperty();
  const saved = savedList?.some((s) => s.property.id === property.id) ?? false;

  const links: Link[] = [
    { id: 'overview', label: 'About', show: true },
    { id: 'gallery', label: 'Gallery', show: !!property.galleryImages?.length },
    { id: 'tours', label: 'Tours', show: property.hasCinematicTour || property.has3DTour || property.hasVRTour },
    { id: 'units', label: 'Residences', show: !!property.units?.length },
    { id: 'location', label: 'Location', show: true },
  ].filter((l) => l.show).map(({ id, label }) => ({ id, label }));

  useEffect(() => {
    let raf = 0;
    let was: boolean | null = null;
    const tick = () => {
      const now = window.scrollY > 60;
      if (now !== was) { was = now; setScrolled(now); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-35% 0px -60% 0px' },
    );
    links.forEach(({ id }) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links.map((l) => l.id).join(',')]);

  useEffect(() => {
    const prev = document.title;
    document.title = property.tagline && property.tagline.length <= 70 ? `${property.name} — ${property.tagline}` : property.name;
    return () => { document.title = prev; };
  }, [property.name, property.tagline]);

  function toggleSaved() {
    if (!isAuthenticated) { router.push(`/login?redirect=${encodeURIComponent(pathname)}`); return; }
    if (saved) remove.mutate(property.slug); else save.mutate(property.slug);
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.name, text: property.tagline ?? property.name, url });
        track({ type: 'SHARE', propertyId: property.id, metadata: { method: 'native' } });
        return;
      }
      await navigator.clipboard.writeText(url);
      track({ type: 'SHARE', propertyId: property.id, metadata: { method: 'clipboard' } });
      setNote('Link copied');
      setTimeout(() => setNote(''), 2000);
    } catch { /* cancelled */ }
  }

  return { scrolled, active, links, saved, toggleSaved, share, note };
}

/** Save and share, as two small round icons. */
function Actions({ nav, color, border }: { nav: ReturnType<typeof useNav>; color: string; border: string }) {
  return (
    <div className="relative flex items-center gap-1.5">
      <button type="button" onClick={nav.toggleSaved} aria-label={nav.saved ? 'Remove from saved' : 'Save property'}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors"
        style={{ borderColor: nav.saved ? 'rgba(239,68,68,0.45)' : border, color: nav.saved ? '#ef4444' : color }}>
        <Heart size={14} className={nav.saved ? 'fill-current' : undefined} />
      </button>
      <button type="button" onClick={nav.share} aria-label="Share this development"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors"
        style={{ borderColor: border, color }}>
        <Share2 size={14} />
      </button>
      {nav.note && <span className="absolute right-0 top-10 whitespace-nowrap rounded-full bg-neutral-900 px-3 py-1 text-[11px] text-white">{nav.note}</span>}
    </div>
  );
}

/** Full-screen menu — every variant's small-screen navigation, and the menu button's target. */
function Overlay({
  open, onClose, nav, property, ctaLabel, dark,
}: {
  open: boolean; onClose: () => void; nav: ReturnType<typeof useNav>; property: Property; ctaLabel: string; dark: boolean;
}) {
  const fg = dark ? '#fff' : '#111';
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col px-6 pb-8 pt-6 sm:px-10"
          style={{ background: dark ? '#0d0d0d' : '#ffffff', color: fg }}
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-medium" style={{ fontFamily: 'var(--tpl-font-heading)' }}>{property.name}</p>
            <button type="button" onClick={onClose} aria-label="Close menu" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border" style={{ borderColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)' }}>
              <X size={18} />
            </button>
          </div>
          <nav className="mt-14 flex flex-1 flex-col gap-2">
            {nav.links.map((l, i) => (
              <motion.a key={l.id} href={`#${l.id}`} onClick={onClose}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i + 0.1, duration: 0.4 }}
                className="text-[36px] leading-tight sm:text-[52px]" style={{ fontFamily: 'var(--tpl-font-heading)', opacity: nav.active === l.id ? 1 : 0.75 }}>
                {l.label}
              </motion.a>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <a href="#booking" onClick={onClose} className="rounded-full px-6 py-3 text-[14px] font-medium" style={{ background: fg, color: dark ? '#111' : '#fff' }}>{ctaLabel}</a>
            <Actions nav={nav} color={fg} border={dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StudioNav({
  variant, property, ctaLabel, ground = '#ffffff',
}: {
  variant: StudioNavVariant;
  property: Property;
  ctaLabel: string;
  /** Background once scrolled, for the variants that start transparent. */
  ground?: string;
}) {
  const nav = useNav(property);
  const [menu, setMenu] = useState(false);
  const { scrolled, links, active } = nav;
  const name = property.name;
  const burger = (color: string, border: string, always = false) => (
    <button type="button" onClick={() => setMenu(true)} aria-label="Open menu"
      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border ${always ? '' : 'lg:hidden'}`}
      style={{ borderColor: border, color }}>
      <Menu size={16} />
    </button>
  );

  let bar: React.ReactNode;

  if (variant === 'frame') {
    const left = links.slice(0, Math.ceil(links.length / 2));
    const right = links.slice(Math.ceil(links.length / 2));
    bar = (
      <nav className="fixed inset-x-0 top-0 z-50 bg-white">
        <div className="grid h-[54px] grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8">
          <div className="hidden gap-6 lg:flex">
            {left.map((l) => <a key={l.id} href={`#${l.id}`} className={`text-[13px] ${active === l.id ? 'text-neutral-900' : 'text-neutral-600'}`}>{l.label}</a>)}
          </div>
          <div className="lg:hidden" />
          <a href="#overview" className="truncate text-center text-[19px] font-black uppercase tracking-[-0.02em] text-neutral-900 sm:text-[22px]" style={{ fontFamily: 'var(--tpl-font-heading)' }}>{name}</a>
          <div className="flex items-center justify-end gap-6">
            <div className="hidden gap-6 lg:flex">
              {right.map((l) => <a key={l.id} href={`#${l.id}`} className={`text-[13px] ${active === l.id ? 'text-neutral-900' : 'text-neutral-600'}`}>{l.label}</a>)}
            </div>
            <div className="hidden lg:block"><Actions nav={nav} color="#555" border="rgba(0,0,0,0.12)" /></div>
            {burger('#111', 'rgba(0,0,0,0.12)')}
          </div>
        </div>
      </nav>
    );
  } else if (variant === 'prestige') {
    const light = !scrolled;
    const fg = light ? '#fff' : '#0f1b2d';
    bar = (
      <nav className="fixed inset-x-0 top-0 z-50 transition-colors duration-500" style={{ background: scrolled ? '#ffffff' : 'transparent', boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,0.06)' : 'none' }}>
        <div className="mx-auto grid h-[68px] max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8">
          <a href="#overview" className="flex min-w-0 items-center gap-2.5">
            <PropertyMonogram name={name} logoUrl={property.logoUrl} size={30} onDark={light} />
            <span className="truncate text-[17px]" style={{ color: fg, fontFamily: 'var(--tpl-font-heading)' }}>{name}</span>
          </a>
          <div className="hidden items-center gap-8 lg:flex">
            {links.map((l) => <a key={l.id} href={`#${l.id}`} className="text-[14px] transition-opacity" style={{ color: fg, opacity: active === l.id ? 1 : 0.8 }}>{l.label}</a>)}
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className="hidden sm:block"><Actions nav={nav} color={fg} border={light ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.12)'} /></div>
            <a href="#booking" className="hidden rounded-md px-4 py-2 text-[13px] font-medium sm:inline-block" style={light ? { background: '#fff', color: '#0f1b2d' } : { background: '#011d41', color: '#fff' }}>{ctaLabel}</a>
            {burger(fg, light ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.12)')}
          </div>
        </div>
      </nav>
    );
  } else if (variant === 'gallery') {
    const light = !scrolled;
    const fg = light ? '#fff' : '#111';
    bar = (
      <nav className="fixed inset-x-2 top-2 z-50 rounded-[24px] transition-colors duration-500 sm:inset-x-3" style={{ background: scrolled ? ground : 'transparent' }}>
        <div className="grid h-[72px] grid-cols-[1fr_auto_1fr] items-center px-6 sm:px-9">
          <a href="#overview" className="truncate text-[22px] font-extrabold uppercase italic tracking-[-0.03em]" style={{ color: fg }}>{name}</a>
          <div className="hidden items-center gap-10 lg:flex">
            {links.map((l) => <a key={l.id} href={`#${l.id}`} className="text-[14px]" style={{ color: fg, opacity: active === l.id ? 1 : 0.85 }}>{l.label}</a>)}
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => setMenu(true)} aria-label="Open menu" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-neutral-900 shadow-sm">
              <span className="flex flex-col gap-[4px]"><span className="block h-[1.5px] w-[16px] bg-current" /><span className="block h-[1.5px] w-[16px] bg-current" /><span className="block h-[1.5px] w-[11px] bg-current" /></span>
            </button>
          </div>
        </div>
      </nav>
    );
  } else if (variant === 'atelier') {
    bar = (
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200/70 bg-white/95 backdrop-blur">
        <div className="grid h-[64px] grid-cols-[1fr_auto_1fr] items-center px-6 sm:px-10">
          <a href="#overview" className="truncate text-[13px] uppercase tracking-[0.32em] text-neutral-900" style={{ fontFamily: 'var(--tpl-font-heading)' }}>{name}</a>
          <button type="button" onClick={() => setMenu(true)} className="flex cursor-pointer items-center gap-2 text-[13px] text-neutral-800">
            <span className="flex flex-col gap-[3px]"><span className="block h-px w-4 bg-current" /><span className="block h-px w-4 bg-current" /></span>Menu
          </button>
          <div className="flex justify-end">
            <a href="#booking" className="border border-neutral-900 px-4 py-2 text-[10.5px] uppercase tracking-[0.2em] text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white">{ctaLabel}</a>
          </div>
        </div>
      </nav>
    );
  } else if (variant === 'horizon') {
    const light = !scrolled;
    const fg = light ? '#fff' : '#111';
    bar = (
      <nav className="fixed inset-x-3 top-3 z-50 rounded-[20px] transition-all duration-500" style={{ background: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent', boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none' }}>
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-6 sm:px-10">
          <a href="#overview" className="flex items-center gap-1 text-[22px] font-semibold tracking-[-0.02em]" style={{ color: fg, fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            <Sparkles size={15} className="-mt-3" />{name}
          </a>
          <div className="flex items-center gap-8">
            <div className="hidden items-center gap-8 lg:flex">
              {links.map((l) => <a key={l.id} href={`#${l.id}`} className="text-[14px]" style={{ color: fg, opacity: active === l.id ? 1 : 0.85 }}>{l.label}</a>)}
            </div>
            <div className="hidden lg:block"><Actions nav={nav} color={fg} border={light ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.12)'} /></div>
            {burger(fg, light ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.12)')}
          </div>
        </div>
      </nav>
    );
  } else if (variant === 'skyline') {
    bar = (
      <nav className="fixed inset-x-0 top-0 z-50 bg-white">
        <div className="mx-auto flex h-[64px] max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <a href="#overview" className="truncate text-[19px] font-medium tracking-[-0.01em] text-neutral-900" style={{ fontFamily: 'var(--tpl-font-heading)' }}>{name}</a>
          <div className="flex items-center gap-7">
            <div className="hidden items-center gap-7 lg:flex">
              {links.map((l) => (
                <a key={l.id} href={`#${l.id}`} className="relative py-1 text-[14px] text-neutral-800">
                  {l.label}
                  {active === l.id && <motion.span layoutId="skyline-underline" className="absolute inset-x-0 -bottom-0.5 h-[1.5px]" style={{ background: '#e5793a' }} />}
                </a>
              ))}
            </div>
            <div className="hidden lg:block"><Actions nav={nav} color="#444" border="rgba(0,0,0,0.12)" /></div>
            <a href="#booking" className="hidden items-center gap-1.5 border border-neutral-300 px-3.5 py-1.5 text-[13px] text-neutral-900 sm:inline-flex">{ctaLabel} <ArrowUpRight size={13} /></a>
            {burger('#111', 'rgba(0,0,0,0.12)')}
          </div>
        </div>
      </nav>
    );
  } else {
    // noir
    bar = (
      <nav className="fixed inset-x-0 top-0 z-50 transition-colors duration-500" style={{ background: scrolled ? '#0a0a0a' : 'transparent' }}>
        <div className={`mx-auto flex max-w-[1400px] justify-between px-5 sm:px-10 ${scrolled ? 'h-[60px] items-center' : 'items-start pt-6'}`}>
          <a href="#overview" className="truncate text-[24px] font-black uppercase italic tracking-[-0.04em] text-white">{name}</a>
          <div className={`hidden lg:flex ${scrolled ? 'flex-row items-center gap-8' : 'flex-col items-end gap-1'}`}>
            {links.map((l) => <a key={l.id} href={`#${l.id}`} className="text-[15px] text-white" style={{ opacity: active === l.id ? 1 : 0.85 }}>{l.label}</a>)}
            {scrolled && <Actions nav={nav} color="#fff" border="rgba(255,255,255,0.3)" />}
          </div>
          {burger('#fff', 'rgba(255,255,255,0.3)')}
        </div>
      </nav>
    );
  }

  const darkMenu = variant === 'noir' || variant === 'prestige';
  return (
    <>
      {bar}
      <Overlay open={menu} onClose={() => setMenu(false)} nav={nav} property={property} ctaLabel={ctaLabel} dark={darkMenu} />
    </>
  );
}
