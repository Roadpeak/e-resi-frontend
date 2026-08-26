'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Menu, X } from 'lucide-react';
import { PropertyMonogram } from '../PropertyMonogram';
import { useAuthStore } from '../../../lib/stores/auth.store';
import {
  useSavedProperties,
  useSaveProperty,
  useRemoveSavedProperty,
} from '../../../lib/api/queries';
import { track } from '../../../lib/analytics/track';
import { SECTIONS } from '../../../lib/branding/theme';
import type { Property } from '../../../lib/types';
import type { MiniSiteTemplate } from '../../../lib/branding/templates';
import type { RentListing } from '../../../lib/types';
import type { SectionCopy } from '../../../lib/branding/theme';
import { PropertyInsights } from '../PropertyInsights';
import { StreetViewButtons } from '../StreetViewButtons';
import { PropertyCinematicPreview } from '../PropertyCinematicPreview';
import { PropertyTours } from '../PropertyTours';
import { PropertyViewer3D } from '../PropertyViewer3D';
import { PropertyRentListings } from '../PropertyRentListings';
import { TemplateHero } from './TemplateHero';
import {
  KitBooking, KitConstruction, KitFloorPlans, KitGallery, KitLocation, KitOverview, KitUnits,
  type KitStyle,
} from './kit';

/**
 * Drives every template except Dark Luxury, which is hand-written because its
 * treatment has no analogue here.
 *
 * Each entry below is a different page: its own ground, type, radii, nav and
 * section forms. What they share is behaviour, via ./hooks — so a booking is
 * filed the same way whichever page a buyer is looking at.
 */

/**
 * Sections whose component renders its own <section id="…">.
 *
 * The wrapper must not add a second element with the same id — duplicate ids
 * silently break getElementById scroll targets and the nav's scroll-spy, which
 * is exactly what happened when the shared tour players were added.
 */
const SELF_ANCHORED = new Set(['rentals', 'tours']);

/** Sections that span the viewport rather than the centred column. */
const FULL_BLEED = new Set(['tours']);

export const KIT_STYLES: Record<string, KitStyle> = {
  EDITORIAL: {
    onDark: false, radius: 'rounded-none', headingKind: 'numbered',
    unitsAs: 'table', galleryAs: 'mosaic', outlined: true,
  },
  CONFIDENT: {
    onDark: false, radius: 'rounded-xl', headingKind: 'eyebrow',
    unitsAs: 'cards', galleryAs: 'grid', outlined: false,
  },
  STATEMENT: {
    onDark: true, radius: 'rounded-none', headingKind: 'numbered',
    unitsAs: 'table', galleryAs: 'mosaic', outlined: true,
  },
  SHOWCASE: {
    onDark: false, radius: 'rounded-2xl', headingKind: 'eyebrow',
    unitsAs: 'cards', galleryAs: 'strip', outlined: false,
  },
  ARCHITECTURAL: {
    onDark: false, radius: 'rounded-none', headingKind: 'numbered',
    unitsAs: 'table', galleryAs: 'grid', outlined: true,
  },
  WARM_LUXE: {
    onDark: false, radius: 'rounded-2xl', headingKind: 'eyebrow',
    unitsAs: 'cards', galleryAs: 'mosaic', outlined: false,
  },
};

/** Page ground per template — several want a tint rather than plain white. */
const GROUNDS: Record<string, string> = {
  EDITORIAL: '#ffffff',
  CONFIDENT: '#ffffff',
  STATEMENT: '#0b0b0c',
  SHOWCASE: '#f4f5f7',
  ARCHITECTURAL: '#ffffff',
  WARM_LUXE: '#f3efe9',
};

function KitNav({
  property,
  ctaLabel,
  style,
  template,
}: {
  property: Property;
  ctaLabel: string;
  style: KitStyle;
  template: MiniSiteTemplate;
}) {
  const [scrolled, setScrolled] = useState(false);
  /** Which section the page is currently on, for the active link state. */
  const [active, setActive] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  /** Transient confirmation for the clipboard share fallback. */
  const [shareNote, setShareNote] = useState('');

  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: savedList } = useSavedProperties();
  const saveMutation = useSaveProperty();
  const removeMutation = useRemoveSavedProperty();
  const saved = savedList?.some((s) => s.property.id === property.id) ?? false;

  function toggleSaved() {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (saved) removeMutation.mutate(property.slug);
    else saveMutation.mutate(property.slug);
  }

  /**
   * Native share sheet where available — which is where this matters, a phone
   * handing straight off to WhatsApp — and the clipboard everywhere else.
   *
   * Sharing is the mini-site's entire distribution mechanism, so it both has
   * to work and has to be measured. The Kit templates had no share control at
   * all, which meant six of eight templates reported no sharing whatsoever.
   */
  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: property.name, text: property.tagline ?? property.name, url });
        track({ type: 'SHARE', propertyId: property.id, metadata: { method: 'native' } });
        return;
      }
      await navigator.clipboard.writeText(url);
      track({ type: 'SHARE', propertyId: property.id, metadata: { method: 'clipboard' } });
      setShareNote('Link copied');
      setTimeout(() => setShareNote(''), 2000);
    } catch {
      // A cancelled share sheet is not an error worth surfacing.
    }
  }

  // Own the browser tab: a shared link that says "e-resi" reads as someone
  // else's site however well the page itself is branded.
  useEffect(() => {
    const previous = document.title;
    document.title = property.tagline
      ? `${property.name} — ${property.tagline}`
      : property.name;
    return () => { document.title = previous; };
  }, [property.name, property.tagline]);

  useEffect(() => {
    // Polled on the animation frame rather than driven by the scroll event.
    //
    // A scroll event does not fire for every way a page can move —
    // scrollIntoView, an anchor jump and a restored position can all leave the
    // bar transparent while the page sits deep in the document, which showed up
    // as white nav links on a white ground. Reading scrollY each frame cannot
    // miss a change however it was caused.
    let raf = 0;
    // Track the boolean, not the offset: setting state on every frame the page
    // moves re-rendered the bar continuously, so a read of its background
    // caught the 500ms transition mid-flight rather than at rest.
    let was: boolean | null = null;
    const tick = () => {
      const now = window.scrollY > 80;
      if (now !== was) {
        was = now;
        setScrolled(now);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /**
   * What the bar links to.
   *
   * Filtered against what the development actually has, rather than the four
   * hardcoded entries this used to carry — which linked to `#overview` and
   * `#location` unconditionally and never mentioned the tours at all, on the
   * templates whose whole pitch is the tours.
   */
  const links = [
    { id: 'gallery', label: 'Gallery', show: !!property.galleryImages?.length },
    {
      id: 'tours',
      label: 'Tours',
      show:
        !!property.hasCinematicTour ||
        !!property.has3DTour ||
        !!property.hasVRTour ||
        typeof property.address?.coordinates?.lat === 'number',
    },
    { id: 'units', label: 'Units', show: !!property.units?.length },
    { id: 'location', label: 'Location', show: true },
  ].filter((l) => l.show);

  // Scroll-spy. The Kit navs were plain anchors with no active state, so a
  // buyer halfway down a nine-thousand-pixel page had no indication of where
  // they were.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    links.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links.map((l) => l.id).join(',')]);

  // Over the hero every nav is light; once the page is behind it, the bar
  // takes the template's own ground and its text flips to match.
  // White text only when the bar is actually dark or actually transparent.
  const onDarkBar = style.onDark;
  const ground = GROUNDS[template.key] ?? '#ffffff';
  // Text colours resolved once, so the bar can never end up light-on-light —
  // which is what happened when a transparent bar kept its over-hero white.
  const fg = onDarkBar ? '#ffffff' : '#18191a';
  const fgMuted = onDarkBar ? 'rgba(255,255,255,0.72)' : 'rgba(24,25,26,0.62)';


  const pill = template.key === 'SHOWCASE' || template.key === 'WARM_LUXE';

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 transition-all duration-500"
      style={{
        // Fully opaque once scrolled. At 95% the headline behind it showed
        // through as a ghost, which read as a rendering fault rather than as
        // translucency.
        // Dark templates keep the transparent-over-hero treatment, because
        // their bar text is white either way. Light ones do not: the failure
        // mode there is white links on a white page, which is unreadable
        // rather than merely less pretty. A solid bar cannot fail that way.
        background: style.onDark && !scrolled ? 'transparent' : ground,
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${
          style.onDark && !scrolled ? 'transparent' : style.onDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)'
        }`,
      }}
    >
      <div className={`mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 sm:px-10`}>
        {/* The developer's own mark — their sales site, their identity in the
            highest-status corner. The monogram stands in when no logo was
            uploaded, which is most developments. */}
        <Link href={`/${property.slug}`} className="flex min-w-0 items-center gap-2.5">
          <PropertyMonogram
            name={property.name}
            logoUrl={property.logoUrl}
            size={34}
            onDark={onDarkBar}
          />
          <span
            className={`truncate text-[16px] ${template.fonts.upperLabels ? 'uppercase tracking-[0.2em]' : 'font-semibold tracking-tight'}`}
            style={{ color: fg, fontFamily: 'var(--tpl-font-heading)' }}
          >
            {property.name}
          </span>
        </Link>

        <div className={`hidden items-center lg:flex ${pill ? 'gap-1 rounded-full px-1.5 py-1.5' : 'gap-8'}`}
          style={pill && scrolled ? { background: style.onDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' } : undefined}
        >
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              aria-current={active === l.id ? 'true' : undefined}
              className={`text-[13px] transition-colors ${pill ? 'rounded-full px-4 py-1.5' : ''} ${
                template.fonts.upperLabels ? 'text-[11px] uppercase tracking-[0.16em]' : ''
              }`}
              // The section the page is actually on takes full-strength text;
              // the rest stay muted.
              style={{ color: active === l.id ? fg : fgMuted }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Actions. Save and share existed only on the classic topbar, so six
            of eight templates offered no way to keep a development or pass it
            on — and reported no share telemetry at all. */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSaved}
            aria-label={saved ? 'Remove from saved' : 'Save property'}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors"
            style={{
              borderColor: saved
                ? 'rgba(239,68,68,0.4)'
                : onDarkBar ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)',
              color: saved ? '#ef4444' : fgMuted,
              background: saved ? 'rgba(239,68,68,0.08)' : 'transparent',
            }}
          >
            <Heart size={15} className={saved ? 'fill-current' : undefined} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share this development"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors"
              style={{
                borderColor: onDarkBar ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)',
                color: fgMuted,
              }}
            >
              <Share2 size={15} />
            </button>
            {shareNote && (
              <span
                className="absolute right-0 top-11 whitespace-nowrap rounded-full px-3 py-1 text-[11px]"
                style={{ background: onDarkBar ? '#fff' : '#18191a', color: onDarkBar ? '#18191a' : '#fff' }}
              >
                {shareNote}
              </span>
            )}
          </div>

          <a
            href="#booking"
            className={`hidden px-6 py-2.5 text-[12px] uppercase tracking-[0.14em] transition-opacity hover:opacity-90 sm:inline-block ${
              pill ? 'rounded-full' : style.radius
            }`}
            style={
              onDarkBar
                ? { border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff' }
                : { background: 'var(--brand)', color: 'var(--brand-on)' }
            }
          >
            {ctaLabel}
          </a>

          {/* Below lg the links above are hidden, and until now nothing
              replaced them — seven of eight templates simply had no navigation
              on a phone, which is where most of this traffic arrives. */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors lg:hidden"
            style={{
              borderColor: onDarkBar ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)',
              color: fg,
            }}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden lg:hidden"
            style={{ background: ground, borderTop: `1px solid ${onDarkBar ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)'}` }}
          >
            <div className="px-6 py-4 sm:px-10">
              {links.map((l) => (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-3 text-[14px] ${
                    template.fonts.upperLabels ? 'text-[12px] uppercase tracking-[0.16em]' : ''
                  }`}
                  style={{ color: active === l.id ? fg : fgMuted }}
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#booking"
                onClick={() => setMobileOpen(false)}
                className={`mt-3 block px-6 py-3 text-center text-[12px] uppercase tracking-[0.14em] ${
                  pill ? 'rounded-full' : style.radius
                }`}
                style={{ background: 'var(--brand)', color: 'var(--brand-on)' }}
              >
                {ctaLabel}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export function KitTemplate({
  template,
  property,
  ctaLabel = 'Book a viewing',
  overlay = true,
  sections,
  whiteLabel,
  sectionCopy,
  unitPriceDisplay,
  rentListings,
}: {
  template: MiniSiteTemplate;
  property: Property;
  ctaLabel?: string;
  overlay?: boolean;
  sections: string[];
  whiteLabel?: boolean;
  /** Developer wording keyed by section id. */
  sectionCopy?: Record<string, SectionCopy>;
  /** Per-unit-type price presentation chosen by the developer. */
  unitPriceDisplay?: Record<string, string> | null;
  /** Live rentals for this development, fetched by the page. */
  rentListings?: RentListing[];
}) {
  const copy = (id: string) => sectionCopy?.[id] ?? {};
  const style = KIT_STYLES[template.key] ?? KIT_STYLES.EDITORIAL;
  const ground = GROUNDS[template.key] ?? '#ffffff';

  const blocks: Record<string, React.ReactNode> = {
    overview: <KitOverview property={property} style={style} copy={copy('overview')} />,
    gallery: (
      <div className="space-y-5">
        <KitGallery
          images={property.galleryImages}
          name={property.name}
          style={style}
          copy={copy('gallery')}
        />
        <StreetViewButtons
          propertyName={property.name}
          photos={property.galleryImages}
          areaPhotos={property.areaPhotos}
          latitude={property.address?.coordinates?.lat}
          longitude={property.address?.coordinates?.lng}
          address={[property.address?.neighborhood, property.address?.city].filter(Boolean).join(', ')}
        />
      </div>
    ),
    tours: (
      <PropertyTours
        propertySlug={property.slug}
        propertyName={property.name}
        has3D={property.has3DTour}
        hasVR={property.hasVRTour}
        hasCinematic={property.hasCinematicTour}
        backdropUrl={property.galleryImages?.[0] ?? property.heroImageUrl}
        photos={property.galleryImages}
        areaPhotos={property.areaPhotos}
        latitude={property.address?.coordinates?.lat}
        longitude={property.address?.coordinates?.lng}
        address={[property.address?.neighborhood, property.address?.city].filter(Boolean).join(', ')}
      />
    ),
    units: (
      <KitUnits
        units={property.units}
        currency={property.currency}
        propertySlug={property.slug}
        style={style}
        copy={copy('units')}
        priceDisplay={unitPriceDisplay}
      />
    ),
    floorplans: (
      <KitFloorPlans floorPlans={property.floorPlans} style={style} copy={copy('floorplans')} />
    ),
    location: (
      <KitLocation
        address={property.address}
        amenities={property.amenities}
        style={style}
        copy={copy('location')}
      />
    ),
    insights: <PropertyInsights property={property as never} />,
    construction: (
      <KitConstruction updates={property.constructionUpdates} style={style} copy={copy('construction')} />
    ),
    // Reuse the shared players rather than rebuild them per template: they
    // launch real tours and carry their own analytics.
    cinematic: property.hasCinematicTour ? <PropertyCinematicPreview property={property} /> : null,
    viewer3d: property.has3DTour ? <PropertyViewer3D property={property} /> : null,
    rentals: rentListings?.length ? <PropertyRentListings listings={rentListings} /> : null,
    booking: <KitBooking property={property} style={style} copy={copy('booking')} />,
  };

  const pad = template.airy ? 'py-24 sm:py-32' : 'py-16 sm:py-20';
  /** Secondary text on this template's ground, for the footer. */
  const muted = style.onDark ? 'rgba(255,255,255,0.50)' : 'rgba(24,25,26,0.55)';

  return (
    <div className="min-h-screen" style={{ background: ground }}>
      <KitNav property={property} ctaLabel={ctaLabel} style={style} template={template} />

      <TemplateHero
        templateKey={template.key}
        property={property}
        ctaLabel={ctaLabel}
        overlay={overlay}
      />

      {/* Striping counts only the sections that actually render. Using the raw
          index meant a hidden or empty section still consumed a stripe, so a
          banded page could put two identical grounds side by side and lose the
          rhythm the banding exists to create. */}
      {sections
        .filter((id) => blocks[id])
        .map((id, i) =>
          // A full-bleed section brings its own ground and padding, and must
          // not be nested in the centred, padded shell below — that max-width
          // is precisely what it needs to escape.
          FULL_BLEED.has(id) ? (
            <div key={id}>{blocks[id]}</div>
          ) : (
            <section
              key={id}
              id={SELF_ANCHORED.has(id) ? undefined : id}
              className={`scroll-mt-28 px-6 sm:px-10 ${pad}`}
              style={
                template.banded && i % 2 === 1
                  ? { background: style.onDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }
                  : undefined
              }
            >
              <div className="mx-auto max-w-[1200px]">{blocks[id]}</div>
            </section>
          ),
        )}

      {/*
        A real footer.

        This was a single line — the name, "Developed by X", and our
        attribution. Everything the classic footer carries was dropped when the
        templates were built: who the developer is, a way back to any section,
        the copyright, and the line saying the details come from the developer
        rather than from us. On a page a buyer may have arrived at from a
        shared link with no other context, that last one matters.
      */}
      <footer
        className="px-6 pb-10 pt-16 sm:px-10"
        style={{ borderTop: `1px solid ${style.onDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}` }}
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {/* The development */}
            <div>
              <div className="flex items-center gap-3">
                <PropertyMonogram
                  name={property.name}
                  logoUrl={property.logoUrl}
                  size={42}
                  onDark={style.onDark}
                />
                <p
                  className={`text-[15px] ${template.fonts.upperLabels ? 'uppercase tracking-[0.18em]' : 'font-semibold'}`}
                  style={{ color: style.onDark ? '#fff' : '#18191a', fontFamily: 'var(--tpl-font-heading)' }}
                >
                  {property.name}
                </p>
              </div>
              {property.tagline && (
                <p className="mt-4 max-w-xs text-[13px] leading-relaxed" style={{ color: muted }}>
                  {property.tagline}
                </p>
              )}
              {(property.address?.neighborhood || property.address?.city) && (
                <p className="mt-4 text-[13px]" style={{ color: muted }}>
                  {[property.address?.neighborhood, property.address?.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Who is building it */}
            {property.developer?.name && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: muted }}>
                  Developer
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <PropertyMonogram
                    name={property.developer.name}
                    logoUrl={property.developer.logoUrl}
                    size={38}
                    onDark={style.onDark}
                  />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium" style={{ color: style.onDark ? '#fff' : '#18191a' }}>
                      {property.developer.name}
                    </p>
                    {property.developer.establishedYear && (
                      <p className="text-[12px]" style={{ color: muted }}>
                        Est. {property.developer.establishedYear}
                      </p>
                    )}
                  </div>
                </div>
                {property.developer.description && (
                  <p className="mt-4 max-w-xs text-[13px] leading-relaxed" style={{ color: muted }}>
                    {property.developer.description}
                  </p>
                )}
              </div>
            )}

            {/* Back to any section */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: muted }}>
                Explore
              </p>
              <ul className="mt-4 space-y-2.5">
                {sections
                  .filter((id) => blocks[id] && id !== 'overview')
                  .slice(0, 6)
                  .map((id) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        className="text-[13px] transition-opacity hover:opacity-100"
                        style={{ color: muted }}
                      >
                        {SECTIONS.find((s) => s.id === id)?.label ?? id}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div
            className="mt-14 flex flex-wrap items-center justify-between gap-4 pt-6"
            style={{ borderTop: `1px solid ${style.onDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)'}` }}
          >
            <p className="text-[12px]" style={{ color: muted }}>
              © {new Date().getFullYear()} {property.developer?.name ?? property.name}
            </p>
            {!whiteLabel && (
              <a
                href="https://e-resi.com"
                target="_blank"
                rel="noreferrer noopener"
                className="text-[11px] uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
                style={{ color: muted }}
              >
                Tours by e-resi
              </a>
            )}
            <p className="text-[12px]" style={{ color: muted }}>
              All property details are provided by the developer.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
