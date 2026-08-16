'use client';

import dynamic from 'next/dynamic';
import { SmallScreenHint } from './SmallScreenHint';
import type { Property, PropertyTour } from '../../../lib/types';

const Tour3DExperience = dynamic(
  () => import('./Tour3DExperience').then((m) => m.Tour3DExperience),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-surface-950" /> }
);

interface Props { property: Property; tour: PropertyTour; }

export function Tour3DClient({ property, tour }: Props) {
  return (
    <>
      <Tour3DExperience property={property} tour={tour} />
      <SmallScreenHint tour="3D" />
    </>
  );
}
