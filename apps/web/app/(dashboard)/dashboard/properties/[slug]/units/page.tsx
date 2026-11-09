'use client';

import { use } from 'react';
import { PropertySubpage } from '../../../../../../components/dashboard/PropertySubpage';
import { FloorPlansManager } from '../../../../../../components/dashboard/FloorPlansManager';
import { UnitsManager } from '../../../../../../components/dashboard/UnitsManager';
import { UnitTypesManager } from '../../../../../../components/dashboard/UnitTypesManager';

export default function PropertyUnitsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <PropertySubpage slug={slug} title="Units & floor plans" description="Your layouts and how many of each are left, plus individual units and floor plans.">
      {(p) => (
        <div className="space-y-6">
          {/* Floor plans first: a unit shows the plan matching its bedroom
              count, so layouts published first give every new unit a drawing. */}
          {/* Types first: most developments sell a handful of layouts many
              times over, and a type with a count is all a buyer needs. */}
          <UnitTypesManager slug={p.slug} currency={p.currency} units={p.units} />
          <FloorPlansManager slug={p.slug} />
          <UnitsManager slug={p.slug} currency={p.currency} units={p.units} />
        </div>
      )}
    </PropertySubpage>
  );
}
