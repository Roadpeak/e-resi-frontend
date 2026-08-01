import { notFound } from 'next/navigation';
import { fetchProperty, fetchPropertySlugs, buildTour } from '../../../../../lib/api/fetch-property';
import { TourVRClient } from '../../../../../components/property/tour/TourVRClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await fetchProperty(slug);
  if (!property) return { title: 'VR Tour' };
  return {
    title: `${property.name} — Immersive VR Tour`,
    description: `Step inside ${property.name} with our fully immersive VR tour.`,
  };
}

export async function generateStaticParams() {
  const liveSlugs = await fetchPropertySlugs();
  return liveSlugs.map((slug) => ({ slug }));
}

export default async function TourVRPage({ params }: Props) {
  const { slug } = await params;
  const property = await fetchProperty(slug);
  if (!property) notFound();

  const tour = buildTour(property as Parameters<typeof buildTour>[0]);
  // Gate on real scenes, not the flag — it can drift when scenes are removed.
  if (!tour || !tour.sections.some((s) => s.scenes.length > 0)) notFound();

  return <TourVRClient property={property} tour={tour} />;
}
