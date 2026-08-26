'use client';

import type { Property } from '../../../../lib/types';
import type { RentListing } from '../../../../lib/types';
import type { SectionCopy } from '../../../../lib/branding/theme';
import { PropertyInsights } from '../../PropertyInsights';
import { StreetViewButtons } from '../../StreetViewButtons';
import { PropertyTours } from '../../PropertyTours';
import { PropertyRentListings } from '../../PropertyRentListings';
import { TemplateHero } from '../TemplateHero';
import { KitNav } from '../KitTemplate';
import type { KitStyle } from '../kit';
import { templateFor } from '../../../../lib/branding/templates';
import { SECTIONS } from '../../../../lib/branding/theme';
import { PropertyMonogram } from '../../PropertyMonogram';
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

/**
 * Sections whose component renders its own <section id="…">; the wrapper must
 * not repeat the id, or anchor navigation and scroll-spy break.
 */
const SELF_ANCHORED = new Set(['rentals', 'tours']);

/**
 * What the shared bar and footer need to know about this template.
 *
 * Luxe is hand-written rather than driven by KIT_STYLES, but the bar is
 * parameterised by exactly these two shapes — so describing Luxe in their
 * terms is cheaper than keeping a second bar alive.
 */
const LUXE_STYLE: KitStyle = {
  onDark: true,
  radius: 'rounded-none',
  headingKind: 'numbered',
  unitsAs: 'table',
  galleryAs: 'mosaic',
  outlined: true,
};

const LUXE_TEMPLATE = templateFor('LUXE_DARK');

/** Sections that span the viewport and bring their own padding. */
const FULL_BLEED = new Set(['tours']);

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  // A full-bleed section is returned bare: wrapping it in this padded, centred
  // shell is exactly what it needs to escape, and no margin trick can undo a
  // max-width it is nested inside.
  if (FULL_BLEED.has(id)) return <>{children}</>;
  return (
    <section id={SELF_ANCHORED.has(id) ? undefined : id} className="scroll-mt-28 px-6 py-24 sm:px-10 sm:py-32">
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
  unitPriceDisplay,
  rentListings,
}: {
  property: Property;
  ctaLabel?: string;
  overlay?: boolean;
  /** Section ids to render, in order — the developer's own arrangement. */
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
  // Same data, this template's markup. Anything the development does not have
  // returns null from its own component, so the section simply does not appear.
  const blocks: Record<string, React.ReactNode> = {
    overview: <LuxeOverview property={property} copy={copy('overview')} />,
    gallery: (
      <div className="space-y-5">
        <LuxeGallery images={property.galleryImages} name={property.name} copy={copy('gallery')} />
        <StreetViewButtons
          propertyName={property.name}
          photos={property.galleryImages}
          areaPhotos={property.areaPhotos}
          latitude={property.address?.coordinates?.lat}
          longitude={property.address?.coordinates?.lng}
          address={[property.address?.neighborhood, property.address?.city].filter(Boolean).join(', ')}
          tone="dark"
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
      <LuxeUnits
        units={property.units}
        currency={property.currency}
        propertySlug={property.slug}
        copy={copy('units')}
        priceDisplay={unitPriceDisplay}
      />
    ),
    floorplans: <LuxeFloorPlans floorPlans={property.floorPlans} copy={copy('floorplans')} />,
    location: (
      <LuxeLocation address={property.address} amenities={property.amenities} copy={copy('location')} />
    ),
    insights: <PropertyInsights property={property as never} tone="dark" />,
    construction: <LuxeConstruction updates={property.constructionUpdates} copy={copy('construction')} />,
    rentals: rentListings?.length ? <PropertyRentListings listings={rentListings} /> : null,
    booking: <LuxeBooking property={property} copy={copy('booking')} />,
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      {/*
        The shared bar, not a private copy.

        Luxe carried its own near-identical LuxeNav, which is why the mobile
        menu, save, share and scroll-spy were restored to the other seven
        templates and not to this one. It keeps its own register through
        navLabels and its own ground through the override; everything else is
        the one implementation.
      */}
      <KitNav
        property={property}
        ctaLabel={ctaLabel}
        style={LUXE_STYLE}
        template={LUXE_TEMPLATE}
        ground="#0b0b0c"
        navLabels={{ units: 'Residences', gallery: 'Gallery', location: 'Location' }}
      />

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

      {/* The full footer, in Luxe's register. It carried one line — the name,
          "Developed by X" and our attribution — and dropped the developer, the
          section links, the copyright and the disclaimer, exactly as the Kit
          footer did before it was rebuilt. */}
      <footer className="border-t border-white/12 px-6 pb-10 pt-16 sm:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                <PropertyMonogram
                  name={property.name}
                  logoUrl={property.logoUrl}
                  size={42}
                  onDark
                />
                <p className="text-[15px] font-light uppercase tracking-[0.2em] text-white">
                  {property.name}
                </p>
              </div>
              {property.tagline && (
                <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/45">
                  {property.tagline}
                </p>
              )}
              {(property.address?.neighborhood || property.address?.city) && (
                <p className="mt-4 text-[13px] text-white/45">
                  {[property.address?.neighborhood, property.address?.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {property.developer?.name && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Developer</p>
                <div className="mt-4 flex items-center gap-3">
                  <PropertyMonogram
                    name={property.developer.name}
                    logoUrl={property.developer.logoUrl}
                    size={38}
                    onDark
                  />
                  <div className="min-w-0">
                    <p className="text-[14px] text-white">{property.developer.name}</p>
                    {property.developer.establishedYear && (
                      <p className="text-[12px] text-white/45">
                        Est. {property.developer.establishedYear}
                      </p>
                    )}
                  </div>
                </div>
                {property.developer.description && (
                  <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/45">
                    {property.developer.description}
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Explore</p>
              <ul className="mt-4 space-y-2.5">
                {sections
                  .filter((id) => blocks[id] && id !== 'overview')
                  .slice(0, 6)
                  .map((id) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        className="text-[13px] text-white/45 transition-colors hover:text-white"
                      >
                        {SECTIONS.find((s) => s.id === id)?.label ?? id}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <p className="text-[12px] text-white/40">
              © {new Date().getFullYear()} {property.developer?.name ?? property.name}
            </p>
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
            <p className="text-[12px] text-white/40">
              All property details are provided by the developer.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
