'use client';

import dynamic from 'next/dynamic';
import { SmallScreenHint } from './SmallScreenHint';
import type { Property, PropertyTour } from '../../../lib/types';

// three.js touches `window` at import time, so this must never run on the server.
const TourViewer3D = dynamic(
  () => import('./TourViewer3D').then((m) => m.TourViewer3D),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-[#0d1117]" /> }
);

interface Props { property: Property; tour: PropertyTour; }

export function Tour3DClient({ property, tour }: Props) {
  return (
    <>
      <TourViewer3D property={property} tour={tour} />
      <SmallScreenHint tour="3D" />
    </>
  );
}
