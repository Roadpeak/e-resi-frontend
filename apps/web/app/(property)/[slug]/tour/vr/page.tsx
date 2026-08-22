import { notFound } from 'next/navigation';
import { fetchProperty, fetchPropertySlugs, fetchTwins, buildTour } from '../../../../../lib/api/fetch-property';
import { TourVRClient } from '../../../../../components/property/tour/TourVRClient';
import type { Metadata } from 'next';
import { TrackTour } from '../../../../../components/property/TrackTour';

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

  /**
   * VR is a headset walking the model, and only falls back to 360° scenes.
   *
   * This used to require scenes — equirectangular stills arranged as a
   * slideshow — so a property captured as geometry, which is now every new
   * one, 404'd here while its 3D tour worked. Gating on either source keeps
   * the older panorama tours working without stranding the current ones.
   */
  const tour = buildTour(property as Parameters<typeof buildTour>[0]);
  const twins = await fetchTwins(slug);
  const hasScenes = !!tour?.sections.some((s) => s.scenes.length > 0);
  if (!twins.length && !hasScenes) notFound();

  return (
    <>
      <TrackTour propertyId={property.id} tour="VR" />
      <TourVRClient property={property} tour={tour} />
    </>
  );
}
