'use client';

import dynamic from 'next/dynamic';
import { SmallScreenHint } from './SmallScreenHint';
import type { Property, PropertyTour } from '../../../lib/types';

const TourVRExperience = dynamic(
  () => import('./TourVRExperience').then((m) => m.TourVRExperience),
  { ssr: false, loading: () => <div className="min-h-screen bg-surface-950" /> }
);

interface Props { property: Property; tour: PropertyTour; }

export function TourVRClient({ property, tour }: Props) {
  return (
    <>
      <TourVRExperience property={property} tour={tour} />
      <SmallScreenHint tour="VR" />
    </>
  );
}
