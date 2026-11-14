import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageFrom, pagedMetadata } from '../../../lib/seo/paging';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { PropertiesPage } from '../../../components/marketplace/PropertiesPage';
import { PropertyDirectory } from '../../../components/marketplace/PropertyDirectory';

const BASE: Metadata = {
  title: 'Buy Apartments in Kenya',
  description:
    "Buy apartments in Kenya. Browse verified apartment developments with cinematic, 3D and VR tours — see unit-level availability, floor plans and pricing before you buy.",
  alternates: { canonical: '/apartments' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Buy Apartments in Kenya — E-resi',
    description:
      'Verified apartment developments across Kenya, with cinematic, 3D and VR tours and unit-level availability.',
    url: '/apartments',
    type: 'website',
  },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Page N of the list lives at ?page=N with its own canonical and title. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return pagedMetadata(BASE, '/apartments', pageFrom(await searchParams) ?? 1);
}

export default async function Apartments({ searchParams }: Props) {
  const page = pageFrom(await searchParams);
  if (page === null) notFound();
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesNavbar />
      <PropertiesPage lockedCategory="APARTMENT" heading="Apartments for sale" initialPage={page} basePath="/apartments" />
      <PropertyDirectory page={page} title="All apartment developments in Kenya" path="/apartments" label="Apartments for sale in Kenya" category="APARTMENT" />
    </div>
  );
}
