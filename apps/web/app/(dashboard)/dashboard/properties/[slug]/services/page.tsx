'use client';

import { use } from 'react';
import { PropertySubpage } from '../../../../../../components/dashboard/PropertySubpage';
import { ProductionServicesPanel } from '../../../../../../components/dashboard/ProductionServicesPanel';

export default function PropertyServicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <PropertySubpage slug={slug} title="Production services" description="Order photography, cinematic video, 3D and VR tours for this development.">
      {(p) => <ProductionServicesPanel slug={p.slug} />}
    </PropertySubpage>
  );
}
