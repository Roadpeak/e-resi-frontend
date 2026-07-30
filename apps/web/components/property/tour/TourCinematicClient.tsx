'use client';

import dynamic from 'next/dynamic';
import type { Property } from '../../../lib/types';

const TourCinematicExperience = dynamic(
  () => import('./TourCinematicExperience').then((m) => m.TourCinematicExperience),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-black" /> }
);

interface Props { property: Property; }

export function TourCinematicClient({ property }: Props) {
  return <TourCinematicExperience property={property} />;
}
