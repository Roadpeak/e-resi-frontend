import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageFrom, pagedMetadata } from '../../../lib/seo/paging';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { PropertiesPage } from '../../../components/marketplace/PropertiesPage';
import { PropertyDirectory } from '../../../components/marketplace/PropertyDirectory';

const BASE: Metadata = {
  title: 'Buy Villas in Kenya',
  description:
    "Buy villas in Kenya. Browse verified villa developments and gated communities with cinematic, 3D and VR tours — see plot sizes, layouts and pricing before you buy.",
  alternates: { canonical: '/villas' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Buy Villas in Kenya — E-resi',
    description:
      'Verified villa developments and gated communities across Kenya, with cinematic, 3D and VR tours.',
    url: '/villas',
    type: 'website',
  },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Page N of the list lives at ?page=N with its own canonical and title. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return pagedMetadata(BASE, '/villas', pageFrom(await searchParams) ?? 1);
}

export default async function Villas({ searchParams }: Props) {
  const page = pageFrom(await searchParams);
  if (page === null) notFound();
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesNavbar />
      <PropertiesPage lockedCategory="VILLA" heading="Villas for sale" initialPage={page} basePath="/villas" />
      <PropertyDirectory page={page} title="All villa developments in Kenya" path="/villas" label="Villas for sale in Kenya" category="VILLA" />
    </div>
  );
}
