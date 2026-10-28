'use client';

import { use } from 'react';
import { PropertySubpage } from '../../../../../../components/dashboard/PropertySubpage';
import { FloorPlansManager } from '../../../../../../components/dashboard/FloorPlansManager';
import { UnitsManager } from '../../../../../../components/dashboard/UnitsManager';

export default function PropertyUnitsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <PropertySubpage slug={slug} title="Units & floor plans" description="What you are selling, what it costs, and how each layout looks.">
      {(p) => (
        <div className="space-y-6">
          {/* Floor plans first: a unit shows the plan matching its bedroom
              count, so layouts published first give every new unit a drawing. */}
          <FloorPlansManager slug={p.slug} />
          <UnitsManager slug={p.slug} currency={p.currency} units={p.units} />
        </div>
      )}
    </PropertySubpage>
  );
}
