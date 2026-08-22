import { notFound } from 'next/navigation';
import { fetchProperty, fetchPropertySlugs, fetchTwins, buildTour } from '../../../../../lib/api/fetch-property';
import { Tour3DClient } from '../../../../../components/property/tour/Tour3DClient';
import type { Metadata } from 'next';
import { TrackTour } from '../../../../../components/property/TrackTour';

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

  /**
   * A 3D tour is a published model, and only falls back to the old scene list.
   *
   * This used to require scenes — photographs and clips arranged as a
   * slideshow — which is what a 3D tour was before it was geometry. A property
   * with a real .glb and no legacy scenes therefore 404'd, which is exactly
   * the case every newly captured development is in.
   */
  const tour = buildTour(property as Parameters<typeof buildTour>[0]);
  const twins = await fetchTwins(slug);
  const hasScenes = !!tour?.sections.some((s) => s.scenes.length > 0);

  if (!twins.length && !hasScenes) notFound();

  return (
    <>
      <TrackTour propertyId={property.id} tour="3D" />
      <Tour3DClient property={property} tour={tour ?? { sections: [] }} />
    </>
  );
}
