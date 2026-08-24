'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Property } from '../../../lib/types';
import type { MiniSiteTemplate } from '../../../lib/branding/templates';
import type { RentListing } from '../../../lib/types';
import type { SectionCopy } from '../../../lib/branding/theme';
import { PropertyInsights } from '../PropertyInsights';
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
const SELF_ANCHORED = new Set(['viewer3d', 'cinematic', 'rentals', 'tours']);

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

  // Over the hero every nav is light; once the page is behind it, the bar
  // takes the template's own ground and its text flips to match.
  // White text only when the bar is actually dark or actually transparent.
  const onDarkBar = style.onDark;
  const ground = GROUNDS[template.key] ?? '#ffffff';
  // Text colours resolved once, so the bar can never end up light-on-light —
  // which is what happened when a transparent bar kept its over-hero white.
  const fg = onDarkBar ? '#ffffff' : '#18191a';
  const fgMuted = onDarkBar ? 'rgba(255,255,255,0.72)' : 'rgba(24,25,26,0.62)';

  const links = [
    { id: 'overview', label: 'Overview' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'units', label: 'Units' },
    { id: 'location', label: 'Location' },
  ];

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
        {/* The developer's own logo when they have uploaded one — it is their
            sales site, so their mark belongs in the bar. */}
        <Link href={`/${property.slug}`} className="flex min-w-0 items-center gap-2.5">
          {property.logoUrl && (
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
              <Image src={property.logoUrl} alt="" fill className="object-cover" sizes="32px" />
            </span>
          )}
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
              className={`text-[13px] transition-colors ${pill ? 'rounded-full px-4 py-1.5' : ''} ${
                template.fonts.upperLabels ? 'text-[11px] uppercase tracking-[0.16em]' : ''
              }`}
              style={{ color: fgMuted }}
            >
              {l.label}
            </a>
          ))}
        </div>

        <a
          href="#booking"
          className={`px-6 py-2.5 text-[12px] uppercase tracking-[0.14em] transition-opacity hover:opacity-90 ${
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
      </div>
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
      <KitGallery
        images={property.galleryImages}
        name={property.name}
        style={style}
        copy={copy('gallery')}
      />
    ),
    tours: (
      <PropertyTours
        propertySlug={property.slug}
        propertyName={property.name}
        has3D={property.has3DTour}
        hasVR={property.hasVRTour}
        hasCinematic={property.hasCinematicTour}
        backdropUrl={property.galleryImages?.[0] ?? property.heroImageUrl}
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

  return (
    <div className="min-h-screen" style={{ background: ground }}>
      <KitNav property={property} ctaLabel={ctaLabel} style={style} template={template} />

      <TemplateHero
        templateKey={template.key}
        property={property}
        ctaLabel={ctaLabel}
        overlay={overlay}
      />

      {sections.map((id, i) =>
        blocks[id] ? (
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
          )
        ) : null,
      )}

      <footer
        className="px-6 py-14 sm:px-10"
        style={{ borderTop: `1px solid ${style.onDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}` }}
      >
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6">
          <div>
            <p
              className={`text-[15px] ${template.fonts.upperLabels ? 'uppercase tracking-[0.18em]' : 'font-semibold'}`}
              style={{ color: style.onDark ? '#fff' : '#18191a', fontFamily: 'var(--tpl-font-heading)' }}
            >
              {property.name}
            </p>
            {property.developer?.name && (
              <p className="mt-2 text-[13px]" style={{ color: style.onDark ? 'rgba(255,255,255,0.45)' : 'rgba(24,25,26,0.5)' }}>
                Developed by {property.developer.name}
              </p>
            )}
          </div>
          {!whiteLabel && (
            <a
              href="https://e-resi.com"
              target="_blank"
              rel="noreferrer noopener"
              className="text-[11px] uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
              style={{ color: style.onDark ? 'rgba(255,255,255,0.3)' : 'rgba(24,25,26,0.35)' }}
            >
              Tours by e-resi
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
