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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await fetchProperty(slug);
  if (!property) return { title: 'Property Not Found' };
  return {
    title: property.name,
    description: property.tagline,
    openGraph: {
      images: [{ url: property.heroImageUrl }],
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

  return (
    <main className="min-h-screen bg-white">
      <TrackPageView propertyId={property.id} />
      <PropertyTopbar property={property} />
      <PropertyHero property={property} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-2 pb-24 space-y-24">
        <section id="overview"><PropertyOverview property={property} /></section>
        <section id="gallery"><PropertyGallery images={property.galleryImages} name={property.name} /></section>
        {property.hasCinematicTour && (
          <section id="cinematic"><PropertyCinematicPreview property={property} /></section>
        )}
        {property.has3DTour && (
          <section id="viewer3d"><PropertyViewer3D property={property} /></section>
        )}
        <section id="floorplans"><PropertyFloorPlans floorPlans={property.floorPlans} /></section>
        <section id="units"><PropertyUnits units={property.units} currency={property.currency} propertySlug={property.slug} /></section>
        {rentListings.length > 0 && (
          <section id="rentals"><PropertyRentListings listings={rentListings} /></section>
        )}
        <section id="location"><PropertyLocation address={property.address} amenities={property.amenities} /></section>
        {property.constructionUpdates?.length > 0 && (
          <section id="construction"><PropertyConstruction updates={property.constructionUpdates} /></section>
        )}
        <section id="booking"><PropertyBooking property={property} /></section>
      </div>
      <PropertyFooter property={property} />
    </main>
  );
}
