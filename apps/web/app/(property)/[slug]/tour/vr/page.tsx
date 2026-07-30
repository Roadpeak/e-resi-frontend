import { notFound } from 'next/navigation';
import { mockProperties } from '../../../../../lib/mock/properties';
import { mockTours } from '../../../../../lib/mock/tours';
import { fetchProperty, fetchPropertySlugs, buildTour } from '../../../../../lib/api/fetch-property';
import { TourVRClient } from '../../../../../components/property/tour/TourVRClient';
import type { Metadata } from 'next';
import type { Property } from '../../../../../lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await fetchProperty(slug) ?? mockProperties.find((p) => p.slug === slug);
  if (!property) return { title: 'VR Tour' };
  return {
    title: `${property.name} — Immersive VR Tour`,
    description: `Step inside ${property.name} with our fully immersive VR tour.`,
  };
}

export async function generateStaticParams() {
  const liveSlugs = await fetchPropertySlugs();
  const mockSlugs = mockProperties.filter((p) => p.hasVRTour).map((p) => p.slug);
  const all = Array.from(new Set([...liveSlugs, ...mockSlugs]));
  return all.map((slug) => ({ slug }));
}

export default async function TourVRPage({ params }: Props) {
  const { slug } = await params;
  const liveProperty = await fetchProperty(slug);
  const property = (liveProperty ?? mockProperties.find((p) => p.slug === slug)) as Property | undefined;
  if (!property || !property.hasVRTour) notFound();

  // Use backend tour data if available, fall back to mock tours
  const tour = liveProperty ? buildTour(liveProperty as Parameters<typeof buildTour>[0]) : mockTours[slug];
  if (!tour || !tour.hasVR) notFound();

  return <TourVRClient property={property} tour={tour} />;
}
