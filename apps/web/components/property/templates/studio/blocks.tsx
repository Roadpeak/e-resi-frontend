'use client';

import type { ReactNode } from 'react';
import type { Property, RentListing } from '../../../../lib/types';
import type { SectionCopy } from '../../../../lib/branding/theme';
import { PropertyInsights } from '../../PropertyInsights';
import { StreetViewButtons } from '../../StreetViewButtons';
import { PropertyTours } from '../../PropertyTours';
import { PropertyRentListings } from '../../PropertyRentListings';
import {
  KitBooking, KitConstruction, KitFloorPlans, KitGallery, KitLocation, KitUnits, type KitStyle,
} from '../kit';

/** Props every studio template receives from the page. */
export interface StudioTemplateProps {
  property: Property;
  ctaLabel?: string;
  overlay?: boolean;
  /** Section ids to render, in the developer's order. */
  sections: string[];
  whiteLabel?: boolean;
  sectionCopy?: Record<string, SectionCopy>;
  unitPriceDisplay?: Record<string, string> | null;
  rentListings?: RentListing[];
}

/**
 * The sections whose behaviour is shared — units, floor plans, booking,
 * location, construction, tours — built in a template's own KitStyle.
 * `overview` is left to each template: it is where their signatures live.
 */
export function standardBlocks(
  p: StudioTemplateProps,
  style: KitStyle,
  overrides: Partial<Record<string, ReactNode>> = {},
): Record<string, ReactNode> {
  const { property } = p;
  const copy = (id: string) => p.sectionCopy?.[id] ?? {};
  const where = [property.address?.neighborhood, property.address?.city].filter(Boolean).join(', ');
  const base: Record<string, ReactNode> = {
    gallery: (
      <div className="space-y-5">
        <KitGallery images={property.galleryImages} name={property.name} style={style} copy={copy('gallery')} />
        <StreetViewButtons
          propertyName={property.name}
          photos={property.galleryImages}
          areaPhotos={property.areaPhotos}
          latitude={property.address?.coordinates?.lat}
          longitude={property.address?.coordinates?.lng}
          address={where}
          tone={style.onDark ? 'dark' : 'light'}
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
        address={where}
      />
    ),
    units: (
      <KitUnits
        units={property.units}
        currency={property.currency}
        propertySlug={property.slug}
        style={style}
        copy={copy('units')}
        priceDisplay={p.unitPriceDisplay}
      />
    ),
    floorplans: <KitFloorPlans floorPlans={property.floorPlans} style={style} copy={copy('floorplans')} />,
    location: <KitLocation address={property.address} amenities={property.amenities} style={style} copy={copy('location')} />,
    insights: <PropertyInsights property={property as never} tone={style.onDark ? 'dark' : 'light'} />,
    construction: property.constructionUpdates?.length
      ? <KitConstruction updates={property.constructionUpdates} style={style} copy={copy('construction')} />
      : null,
    rentals: p.rentListings?.length ? <PropertyRentListings listings={p.rentListings} /> : null,
    booking: <KitBooking property={property} style={style} copy={copy('booking')} />,
  };
  return { ...base, ...overrides };
}

/** Sections that render their own <section id> or span the viewport. */
const SELF_ANCHORED = new Set(['rentals', 'tours']);
const FULL_BLEED = new Set(['tours']);

/**
 * Lays out the developer's sections in their order, each wrapped in the
 * template's chrome, with the template's signature pieces slotted in after
 * the section they belong to. A signature piece only appears when its anchor
 * section does, so hiding "Location" also hides what hangs off it.
 */
export function StudioSections({
  sections,
  blocks,
  after = {},
  wrapClass,
  bleed = [],
}: {
  sections: string[];
  blocks: Record<string, ReactNode>;
  after?: Partial<Record<string, ReactNode>>;
  /** Classes for the padded wrapper of section i. */
  wrapClass: (id: string, i: number) => string;
  /** Extra ids this template renders full-width without the wrapper. */
  bleed?: string[];
}) {
  const visible = sections.filter((id) => blocks[id]);
  const fullBleed = new Set([...FULL_BLEED, ...bleed]);
  return (
    <>
      {visible.map((id, i) => (
        <div key={id}>
          {fullBleed.has(id) ? (
            <div id={SELF_ANCHORED.has(id) ? undefined : id} className="scroll-mt-24">{blocks[id]}</div>
          ) : (
            <section id={SELF_ANCHORED.has(id) ? undefined : id} className={`scroll-mt-24 ${wrapClass(id, i)}`}>
              <div className="mx-auto max-w-[1240px]">{blocks[id]}</div>
            </section>
          )}
          {after[id] ?? null}
        </div>
      ))}
    </>
  );
}
