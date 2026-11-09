import type { Metadata } from 'next';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { JsonLd, SITE_URL, breadcrumbs } from '../../../../components/seo/JsonLd';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.e-resi.com/api';

interface Props { params: Promise<{ slug: string }> }

/* eslint-disable @typescript-eslint/no-explicit-any */
/** One cached fetch shared by the metadata, the structured data and the page. */
async function load(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/rent-listings/${slug}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json && typeof json === 'object' && 'success' in json && 'data' in json ? json.data : json;
  } catch {
    return null;
  }
}

/** A rental link is shared on its own, so it carries the listing's own title. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const l = await load(slug);
  if (!l) return { title: 'Rental' };
  const where = [l.neighborhood, l.city].filter(Boolean).join(', ');
  const rent = l.priceFrom ? ` from ${l.currency ?? 'KES'} ${Math.round(l.priceFrom).toLocaleString()}/month` : '';
  const title = `${l.name} — to rent${where ? ` in ${where}` : ''}`;
  const description = l.tagline || `${l.name}${where ? ` in ${where}` : ''}${rent}. Photos, tours and viewings on e-resi.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/rent/${slug}` },
    openGraph: { siteName: 'E-resi', title, description, url: `/rent/${slug}`, type: 'website', ...(l.heroImageUrl ? { images: [l.heroImageUrl] } : {}) },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/** Schema.org description of the rental: what it is, where, and what it costs a month. */
function listingSchema(l: any, slug: string) {
  const url = `${SITE_URL}/rent/${slug}`;
  const images = [l.heroImageUrl, ...((l.media ?? []) as any[]).filter((m) => m.type === 'PHOTO').map((m) => m.url)]
    .filter(Boolean).slice(0, 8);
  const units: any[] = l.rentUnits ?? [];
  const beds = units.map((u) => u.bedrooms).filter((n) => typeof n === 'number');
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: l.name,
    url,
    description: l.description || l.tagline || undefined,
    image: images,
    datePosted: l.createdAt,
    ...(l.priceFrom ? {
      offers: {
        '@type': 'Offer',
        businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
        priceCurrency: l.currency ?? 'KES',
        price: l.priceFrom,
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          priceCurrency: l.currency ?? 'KES',
          minPrice: l.priceFrom,
          ...(l.priceTo && l.priceTo !== l.priceFrom ? { maxPrice: l.priceTo } : {}),
          unitCode: 'MON',
        },
        availability: l.status === 'FULLY_LET' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        url,
      },
    } : {}),
    about: {
      '@type': 'Apartment',
      name: l.name,
      ...(beds.length ? { numberOfBedrooms: Math.min(...beds) } : {}),
      address: {
        '@type': 'PostalAddress',
        addressLocality: l.neighborhood ?? l.city ?? undefined,
        addressRegion: l.city ?? undefined,
        addressCountry: 'KE',
      },
      ...(l.latitude && l.longitude ? { geo: { '@type': 'GeoCoordinates', latitude: l.latitude, longitude: l.longitude } } : {}),
    },
  };
}

/**
 * The listing is fetched here on the server and handed to the page's query,
 * so the photos, rent, units and description are in the HTML Google reads —
 * not only after the page's JavaScript runs.
 */
export default async function RentListingLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await load(slug);
  if (!l) return children;

  const qc = new QueryClient();
  qc.setQueryData(['rent-listing', slug], l);
  return (
    <>
      <JsonLd data={listingSchema(l, slug)} />
      <JsonLd data={breadcrumbs([
        { name: 'Home', path: '/' },
        { name: 'Rent', path: '/rent' },
        { name: l.name, path: `/rent/${slug}` },
      ])} />
      <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
    </>
  );
}
