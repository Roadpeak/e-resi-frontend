import { notFound } from 'next/navigation';
import { mockProperties } from '../../../../../lib/mock/properties';
import { fetchProperty, fetchPropertySlugs } from '../../../../../lib/api/fetch-property';
import { TourCinematicClient } from '../../../../../components/property/tour/TourCinematicClient';
import type { Metadata } from 'next';
import type { Property } from '../../../../../lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await fetchProperty(slug) ?? mockProperties.find((p) => p.slug === slug);
  if (!property) return { title: 'Cinematic Tour' };
  return {
    title: `${property.name} — Cinematic Tour`,
    description: `Experience ${property.name} through a scroll-driven cinematic flythrough.`,
  };
}

export async function generateStaticParams() {
  const liveSlugs = await fetchPropertySlugs();
  const mockSlugs = mockProperties.filter((p) => p.hasCinematicTour).map((p) => p.slug);
  const all = Array.from(new Set([...liveSlugs, ...mockSlugs]));
  return all.map((slug) => ({ slug }));
}

export default async function TourCinematicPage({ params }: Props) {
  const { slug } = await params;
  const property = (await fetchProperty(slug) ?? mockProperties.find((p) => p.slug === slug)) as Property | undefined;
  if (!property || !property.hasCinematicTour) notFound();
  return <TourCinematicClient property={property} />;
}
