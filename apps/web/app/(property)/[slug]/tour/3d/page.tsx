import { notFound } from 'next/navigation';
import { mockProperties } from '../../../../../lib/mock/properties';
import { mockTours } from '../../../../../lib/mock/tours';
import { fetchProperty, fetchPropertySlugs, buildTour } from '../../../../../lib/api/fetch-property';
import { Tour3DClient } from '../../../../../components/property/tour/Tour3DClient';
import type { Metadata } from 'next';
import type { Property } from '../../../../../lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await fetchProperty(slug) ?? mockProperties.find((p) => p.slug === slug);
  if (!property) return { title: '3D Tour' };
  return {
    title: `${property.name} — Interactive 3D Tour`,
    description: `Explore ${property.name} with our interactive 3D tour.`,
  };
}

export async function generateStaticParams() {
  const liveSlugs = await fetchPropertySlugs();
  const mockSlugs = mockProperties.filter((p) => p.has3DTour).map((p) => p.slug);
  const all = Array.from(new Set([...liveSlugs, ...mockSlugs]));
  return all.map((slug) => ({ slug }));
}

export default async function Tour3DPage({ params }: Props) {
  const { slug } = await params;
  const liveProperty = await fetchProperty(slug);
  const property = (liveProperty ?? mockProperties.find((p) => p.slug === slug)) as Property | undefined;
  if (!property || !property.has3DTour) notFound();

  // Use backend tour data if available, fall back to mock tours
  const tour = liveProperty ? buildTour(liveProperty as Parameters<typeof buildTour>[0]) : mockTours[slug];
  if (!tour) notFound();

  return <Tour3DClient property={property} tour={tour} />;
}
