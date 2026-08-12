import { notFound } from 'next/navigation';
import { fetchProperty } from '../../../../lib/api/fetch-property';
import { PropertyTopbar } from '../../../../components/property/PropertyTopbar';
import { PropertyFooter } from '../../../../components/property/PropertyFooter';
import { PropertyHero } from '../../../../components/property/PropertyHero';
import { PropertyOverview } from '../../../../components/property/PropertyOverview';
import { PropertyGallery } from '../../../../components/property/PropertyGallery';
import { PropertyViewer3D } from '../../../../components/property/PropertyViewer3D';
import { PropertyCinematicPreview } from '../../../../components/property/PropertyCinematicPreview';
import { PropertyFloorPlans } from '../../../../components/property/PropertyFloorPlans';
import { PropertyUnits } from '../../../../components/property/PropertyUnits';
import { PropertyLocation } from '../../../../components/property/PropertyLocation';
import { PropertyConstruction } from '../../../../components/property/PropertyConstruction';
import { PropertyBooking } from '../../../../components/property/PropertyBooking';
import { resolveBranding, themeVars, type BrandingSource } from '../../../../lib/branding/theme';
import type { Metadata } from 'next';
import type { Property } from '../../../../lib/types';

/**
 * The customise screen's live preview.
 *
 * This exists as its own route rather than as a query-param mode on /[slug]
 * because reading searchParams there opted the public page out of static
 * generation entirely — every buyer would have paid for a feature only the
 * developer's dashboard uses.
 *
 * It renders the same components with the same branding pipeline, so what a
 * developer approves here is what their buyers get. Two deliberate
 * omissions: no analytics (a developer previewing their own page must not
 * pollute their engagement numbers) and no indexing.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Preview' },
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** First value of a possibly-repeated query param, or undefined. */
const str = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) || undefined;

/** Comma-separated query param to a string array. */
const list = (v: string | string[] | undefined) =>
  (str(v) ?? '').split(',').map((x) => x.trim()).filter(Boolean);

/** Mirrors the public page — components that own their anchor id. */
const SELF_ANCHORED = new Set([
  'gallery', 'viewer3d', 'floorplans', 'units', 'location', 'construction', 'booking',
]);

export default async function PropertyPreviewPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const property: Property | null = await fetchProperty(slug);
  if (!property) notFound();

  const sp = await searchParams;

  // Unsaved edits ride in as query params. They only ever affect presentation,
  // so there is nothing a visitor could change here beyond their own view.
  const branding = resolveBranding({
    ...(property as BrandingSource),
    brandColor: str(sp.brandColor) ?? (property as BrandingSource).brandColor,
    brandFont: str(sp.brandFont) ?? (property as BrandingSource).brandFont,
    heroStyle: str(sp.heroStyle) ?? (property as BrandingSource).heroStyle,
    ctaLabel: str(sp.ctaLabel) ?? (property as BrandingSource).ctaLabel,
    hiddenSections: list(sp.hidden),
    sectionOrder: list(sp.order),
  });

  // Rent listings are omitted: they are a live cross-sell, not something the
  // developer is styling, and fetching them would slow every keystroke in the
  // editor. The section is simply absent from the preview.
  const blocks: Record<string, React.ReactNode> = {
    overview: <PropertyOverview property={property} />,
    gallery: <PropertyGallery images={property.galleryImages} name={property.name} />,
    cinematic: property.hasCinematicTour ? <PropertyCinematicPreview property={property} /> : null,
    viewer3d: property.has3DTour ? <PropertyViewer3D property={property} /> : null,
    floorplans: <PropertyFloorPlans floorPlans={property.floorPlans} />,
    units: (
      <PropertyUnits units={property.units} currency={property.currency} propertySlug={property.slug} />
    ),
    location: <PropertyLocation address={property.address} amenities={property.amenities} />,
    construction: property.constructionUpdates?.length
      ? <PropertyConstruction updates={property.constructionUpdates} />
      : null,
    booking: <PropertyBooking property={property} />,
  };

  return (
    <main
      className="min-h-screen bg-white"
      style={{ ...themeVars(branding.theme), fontFamily: 'var(--brand-font-body)' }}
    >
      <PropertyTopbar property={property} ctaLabel={branding.ctaLabel} />
      <PropertyHero property={property} heroStyle={branding.heroStyle} ctaLabel={branding.ctaLabel} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-2 pb-24 space-y-24">
        {branding.sections.map((id) =>
          blocks[id] ? (
            <div key={id} id={SELF_ANCHORED.has(id) ? undefined : id}>
              {blocks[id]}
            </div>
          ) : null,
        )}
      </div>
      <PropertyFooter property={property} whiteLabel={branding.whiteLabel} />
    </main>
  );
}
