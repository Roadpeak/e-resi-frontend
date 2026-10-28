'use client';

import { use } from 'react';
import { PropertySubpage } from '../../../../../../components/dashboard/PropertySubpage';
import { CustomDomainCard } from '../../../../../../components/dashboard/CustomDomainCard';
import { EresiAddressCard } from '../../../../../../components/dashboard/EresiAddressCard';

export default function PropertyDomainPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <PropertySubpage slug={slug} title="Domain" description="Where buyers find this development's own site.">
      {(p) => {
        const published = p.status !== 'DRAFT' && p.status !== 'ARCHIVED';
        return (
          <div className="space-y-6">
            <EresiAddressCard slug={p.slug} current={p.subdomain} published={published} />
            <CustomDomainCard slug={p.slug} current={p.customDomain} published={published} />
          </div>
        );
      }}
    </PropertySubpage>
  );
}
