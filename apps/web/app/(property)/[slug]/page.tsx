import { notFound } from 'next/navigation';
import { fetchProperty, fetchPropertySlugs } from '../../../lib/api/fetch-property';
import { PropertyTopbar } from '../../../components/property/PropertyTopbar';
import { TrackPageView } from '../../../components/property/TrackPageView';
import { PropertyFooter } from '../../../components/property/PropertyFooter';
import { PropertyHero } from '../../../components/property/PropertyHero';
import { PropertyOverview } from '../../../components/property/PropertyOverview';
import { PropertyGallery } from '../../../components/property/PropertyGallery';
import { PropertyViewer3D } from '../../../components/property/PropertyViewer3D';
import { PropertyCinematicPreview } from '../../../components/property/PropertyCinematicPreview';
import { PropertyFloorPlans } from '../../../components/property/PropertyFloorPlans';
import { PropertyUnits } from '../../../components/property/PropertyUnits';
import { PropertyLocation } from '../../../components/property/PropertyLocation';
import { PropertyConstruction } from '../../../components/property/PropertyConstruction';
import { PropertyBooking } from '../../../components/property/PropertyBooking';
import { PropertyRentListings } from '../../../components/property/PropertyRentListings';
import { resolveBranding, themeVars, type BrandingSource } from '../../../lib/branding/theme';
import { surfaceTokens, surfaceVars, templateFontVars } from '../../../lib/branding/templates';
import { TemplateHero } from '../../../components/property/templates/TemplateHero';
import { LuxeDarkTemplate } from '../../../components/property/templates/luxe-dark/LuxeDarkTemplate';
import { KitTemplate } from '../../../components/property/templates/KitTemplate';
import { TemplateSection } from '../../../components/property/templates/TemplateShell';
import type { Metadata } from 'next';
import type { Property } from '../../../lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function fetchRentListings(propertyId: string) {
  try {
    const res = await fetch(`${API_BASE}/rent-listings?propertyId=${propertyId}&limit=10`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.data?.data ?? json.data ?? [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Sections whose component already renders its own `<section id="…">`. The
 * page must not add a second element with the same id — duplicate ids break
 * `getElementById` scroll targets and the IntersectionObserver scroll-spy.
 */
const SELF_ANCHORED = new Set([
  'gallery', 'viewer3d', 'floorplans', 'units', 'location', 'construction', 'booking',
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await fetchProperty(slug);
  if (!property) return { title: 'Property Not Found' };
  const city = property.address?.city;
  const description = property.tagline
    ? `${property.tagline} — tour ${property.name} in cinematic, 3D and VR${city ? ` in ${city}, Kenya` : ' in Kenya'}.`
    : `Tour ${property.name} in cinematic, 3D and VR${city ? ` in ${city}, Kenya` : ' in Kenya'}. Verified property developer listing on E-resi.`;
  // The mini-site is the developer's own sales site, so it identifies as the
  // development — `absolute` bypasses the "… | E-resi" template that would
  // otherwise put our name in the tab of a link they shared.
  // siteName carries the developer instead, since that is what a WhatsApp
  // preview renders above the title.
  const developerName = property.developer?.name;

  // `images` is deliberately not set here. The generated card lives in
  // opengraph-image.tsx, and Next serves it from a content-hashed path
  // (…/opengraph-image-1t04xb) that it injects automatically. Hardcoding
  // "/<slug>/opengraph-image" produced a 404 — and a broken share preview is
  // invisible until someone actually pastes the link into WhatsApp.
  return {
    title: { absolute: `${property.name}${city ? ` — ${city}` : ''}` },
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      siteName: developerName || 'E-resi',
      title: property.name,
      description,
      url: `/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: property.name,
      description,
    },
  };
}

// Static params come from the live API; ISR handles new slugs at runtime
export async function generateStaticParams() {
  const liveSlugs = await fetchPropertySlugs();
  return liveSlugs.map((slug) => ({ slug }));
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;

  const property: Property | null = await fetchProperty(slug);
  if (!property) notFound();

  const rentListings = await fetchRentListings(property.id);

  // Effective branding: the development's own values, then the developer's
  // defaults, then ours. Resolved server-side so the page paints already
  // branded — no flash of e-resi blue before the developer's colour loads.
  //
  // Deliberately does NOT read searchParams: doing so opts this route out of
  // static generation entirely (DYNAMIC_SERVER_USAGE against
  // generateStaticParams), which would make every buyer's page slower to
  // serve a dashboard preview feature. The customise screen previews via
  // /[slug]/preview instead.
  const branding = resolveBranding(property as BrandingSource);

  // Sections are keyed by the same anchor ids the topbar links to, so
  // reordering and hiding need no changes in the section components.
  const blocks: Record<string, React.ReactNode> = {
    overview: <PropertyOverview property={property} />,
    gallery: <PropertyGallery images={property.galleryImages} name={property.name} />,
    cinematic: property.hasCinematicTour ? <PropertyCinematicPreview property={property} /> : null,
    viewer3d: property.has3DTour ? <PropertyViewer3D property={property} /> : null,
    floorplans: <PropertyFloorPlans floorPlans={property.floorPlans} />,
    units: (
      <PropertyUnits
        units={property.units}
        currency={property.currency}
        propertySlug={property.slug}
        priceDisplay={branding.unitPriceDisplay}
      />
    ),
    rentals: rentListings.length > 0 ? <PropertyRentListings listings={rentListings} /> : null,
    location: <PropertyLocation address={property.address} amenities={property.amenities} />,
    construction: property.constructionUpdates?.length
      ? <PropertyConstruction updates={property.constructionUpdates} />
      : null,
    booking: <PropertyBooking property={property} />,
  };

  const template = branding.template;
  const surface = surfaceTokens(template.surface);

  // Sections that will actually render, so band striping counts real blocks —
  // numbering by position in `branding.sections` would alternate on hidden
  // ones too and produce two identical grounds in a row.
  const visible = branding.sections.filter((id) => blocks[id]);

  // Templates that own the whole page render their own nav, sections and
  // footer — the shared sections are built for a white ground and are
  // unreadable on this one, so they are replaced rather than re-skinned.
  if (template.key !== 'CLASSIC') {
    const Rendered = template.key === 'LUXE_DARK' ? LuxeDarkTemplate : null;
    return (
      <main
        style={{
          ...themeVars(branding.theme),
          ...templateFontVars(template),
          // The template's own face wins over the developer's brand pairing:
          // its type is part of the design, not a default to be overridden.
          fontFamily: 'var(--tpl-font-body)',
        }}
      >
        <TrackPageView propertyId={property.id} />
        {Rendered ? (
          <Rendered
            property={property}
            ctaLabel={branding.ctaLabel}
            overlay={branding.heroOverlay}
            sections={branding.sections}
            whiteLabel={branding.whiteLabel}
            sectionCopy={branding.sectionCopy}
            rentListings={rentListings}
          />
        ) : (
          <KitTemplate
            template={template}
            property={property}
            ctaLabel={branding.ctaLabel}
            overlay={branding.heroOverlay}
            sections={branding.sections}
            whiteLabel={branding.whiteLabel}
            sectionCopy={branding.sectionCopy}
            rentListings={rentListings}
          />
        )}
      </main>
    );
  }

  return (
    <main
      className="min-h-screen"
      style={{
        ...themeVars(branding.theme),
        ...surfaceVars(template.surface),
        background: surface.bg,
        color: surface.text,
        fontFamily: 'var(--brand-font-body)',
      }}
    >
      <TrackPageView propertyId={property.id} />
      <PropertyTopbar
        property={property}
        ctaLabel={branding.ctaLabel}
        navbarStyle={branding.navbarStyle}
        navbar={branding.navbar}
      />

      {/* A template with a signature opening supplies its own hero; the rest
          fall through to the configurable one, so CLASSIC — and any
          development that has never picked a template — is untouched. */}
      {template.ownsHero ? (
        <TemplateHero
          templateKey={template.key}
          property={property}
          ctaLabel={branding.ctaLabel}
          overlay={branding.heroOverlay}
        />
      ) : (
        <PropertyHero
          property={property}
          heroStyle={branding.heroStyle}
          ctaLabel={branding.ctaLabel}
          overlay={branding.heroOverlay}
        />
      )}

      {template.key === 'CLASSIC' ? (
        // Preserved verbatim: the original single-column layout.
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-2 pb-24 space-y-24">
          {/* Only wrap with an id when the component does not already provide
              its own <section id="…">. Wrapping unconditionally put the same id
              in the DOM twice, which silently breaks the topbar's anchor
              navigation and scroll-spy. */}
          {visible.map((id) => (
            <div key={id} id={SELF_ANCHORED.has(id) ? undefined : id}>
              {blocks[id]}
            </div>
          ))}
        </div>
      ) : (
        <div className="pb-10">
          {visible.map((id, i) => (
            <TemplateSection
              key={id}
              // Same rule as above — a section that anchors itself must not be
              // given the id twice.
              id={SELF_ANCHORED.has(id) ? '' : id}
              index={i}
              template={template}
            >
              {blocks[id]}
            </TemplateSection>
          ))}
        </div>
      )}

      <PropertyFooter property={property} whiteLabel={branding.whiteLabel} />
    </main>
  );
}
