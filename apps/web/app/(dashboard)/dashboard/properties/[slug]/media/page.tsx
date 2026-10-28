'use client';

import { use } from 'react';
import { PropertySubpage } from '../../../../../../components/dashboard/PropertySubpage';
import { PropertyMediaManager } from '../../../../../../components/dashboard/PropertyMediaManager';

export default function PropertyMediaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <PropertySubpage slug={slug} title="Media" description="Gallery images, logo and the videos behind your tours.">
      {(p) => <PropertyMediaManager slug={p.slug} heroImageUrl={p.heroImageUrl} />}
    </PropertySubpage>
  );
}
