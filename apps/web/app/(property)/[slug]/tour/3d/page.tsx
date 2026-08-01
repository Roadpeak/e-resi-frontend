import { notFound } from 'next/navigation';
import { fetchProperty, fetchPropertySlugs, buildTour } from '../../../../../lib/api/fetch-property';
import { Tour3DClient } from '../../../../../components/property/tour/Tour3DClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await fetchProperty(slug);
  if (!property) return { title: '3D Tour' };
  return {
    title: `${property.name} — Interactive 3D Tour`,
    description: `Explore ${property.name} with our interactive 3D tour.`,
  };
}

export async function generateStaticParams() {
  const liveSlugs = await fetchPropertySlugs();
  return liveSlugs.map((slug) => ({ slug }));
}

export default async function Tour3DPage({ params }: Props) {
  const { slug } = await params;
  const property = await fetchProperty(slug);
  if (!property) notFound();

  const tour = buildTour(property as Parameters<typeof buildTour>[0]);
  if (!tour || !tour.sections.some((s) => s.scenes.length > 0)) notFound();

  return <Tour3DClient property={property} tour={tour} />;
}
