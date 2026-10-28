'use client';

import { use } from 'react';
import { PropertySubpage } from '../../../../../../components/dashboard/PropertySubpage';
import { NearbyPlacesManager } from '../../../../../../components/dashboard/NearbyPlacesManager';

export default function PropertyNearbyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <PropertySubpage slug={slug} title="Nearby places" description="Schools, hospitals, malls and landmarks buyers care about.">
      {(p) => (
        <NearbyPlacesManager
          slug={p.slug}
          latitude={p.latitude}
          longitude={p.longitude}
          amenities={p.amenities ?? []}
        />
      )}
    </PropertySubpage>
  );
}
