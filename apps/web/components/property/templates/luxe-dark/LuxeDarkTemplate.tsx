'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Property } from '../../../../lib/types';
import type { SectionCopy } from '../../../../lib/branding/theme';
import { TemplateHero } from '../TemplateHero';
import {
  LuxeBooking,
  LuxeConstruction,
  LuxeFloorPlans,
  LuxeGallery,
  LuxeLocation,
  LuxeOverview,
  LuxeUnits,
} from './sections';

/**
 * Dark Luxury — a complete page, not a wrapper.
 *
 * The shared sections are built for a white page; on this ground they render
 * white cards and dark-on-dark text. So this template brings its own nav, its
 * own sections and its own type scale, and takes only the *behaviour* from
 * ../hooks — the same booking submission, unit filtering and lightbox the
 * other templates use.
 */

/** Its own nav: hairline, uppercase, transparent until you leave the hero. */
function LuxeNav({ property, ctaLabel }: { property: Property; ctaLabel: string }) {
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

  const links = [
    { id: 'overview', label: 'Development' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'units', label: 'Residences' },
    { id: 'location', label: 'Location' },
  ];

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(11,11,12,0.86)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.10)' : 'transparent'}`,
      }}
    >
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 sm:px-10">
        <Link
          href={`/${property.slug}`}
          className="text-[15px] font-light uppercase tracking-[0.22em] text-white"
        >
          {property.name}
        </Link>

        <div className="hidden items-center gap-9 lg:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="text-[11px] uppercase tracking-[0.18em] text-white/55 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <a
          href="#booking"
          className="border border-white/25 px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-white hover:text-black"
        >
          {ctaLabel}
        </a>
      </div>
    </nav>
  );
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 px-6 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </section>
  );
}

export function LuxeDarkTemplate({
  property,
  ctaLabel = 'Book a viewing',
  overlay = true,
  sections,
  whiteLabel,
  sectionCopy,
}: {
  property: Property;
  ctaLabel?: string;
  overlay?: boolean;
  /** Section ids to render, in order — the developer's own arrangement. */
  sections: string[];
  whiteLabel?: boolean;
  /** Developer wording keyed by section id. */
  sectionCopy?: Record<string, SectionCopy>;
}) {
  const copy = (id: string) => sectionCopy?.[id] ?? {};
  // Same data, this template's markup. Anything the development does not have
  // returns null from its own component, so the section simply does not appear.
  const blocks: Record<string, React.ReactNode> = {
    overview: <LuxeOverview property={property} copy={copy('overview')} />,
    gallery: (
      <LuxeGallery images={property.galleryImages} name={property.name} copy={copy('gallery')} />
    ),
    units: (
      <LuxeUnits
        units={property.units}
        currency={property.currency}
        propertySlug={property.slug}
        copy={copy('units')}
      />
    ),
    floorplans: <LuxeFloorPlans floorPlans={property.floorPlans} copy={copy('floorplans')} />,
    location: (
      <LuxeLocation address={property.address} amenities={property.amenities} copy={copy('location')} />
    ),
    construction: <LuxeConstruction updates={property.constructionUpdates} copy={copy('construction')} />,
    booking: <LuxeBooking property={property} copy={copy('booking')} />,
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <LuxeNav property={property} ctaLabel={ctaLabel} />

      <TemplateHero
        templateKey="LUXE_DARK"
        property={property}
        ctaLabel={ctaLabel}
        overlay={overlay}
      />

      {sections.map((id) =>
        blocks[id] ? (
          <Section key={id} id={id}>
            {blocks[id]}
          </Section>
        ) : null,
      )}

      <footer className="border-t border-white/12 px-6 py-14 sm:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-[15px] font-light uppercase tracking-[0.2em] text-white">
              {property.name}
            </p>
            {property.developer?.name && (
              <p className="mt-2 text-[13px] text-white/45">
                Developed by {property.developer.name}
              </p>
            )}
          </div>
          {!whiteLabel && (
            <a
              href="https://e-resi.com"
              target="_blank"
              rel="noreferrer noopener"
              className="text-[11px] uppercase tracking-[0.16em] text-white/30 transition-colors hover:text-white/60"
            >
              Tours by e-resi
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
