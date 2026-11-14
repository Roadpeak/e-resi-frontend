import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageFrom, pagedMetadata } from '../../../lib/seo/paging';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { PropertiesPage } from '../../../components/marketplace/PropertiesPage';
import { PropertyDirectory } from '../../../components/marketplace/PropertyDirectory';

const BASE: Metadata = {
  title: 'Buy Commercial Property in Kenya',
  description:
    "Buy commercial property in Kenya. Browse verified offices, retail and mixed-use developments with cinematic, 3D and VR tours — floor plates, availability and pricing in one place.",
  alternates: { canonical: '/commercial' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Buy Commercial Property in Kenya — E-resi',
    description:
      'Verified commercial developments across Kenya — offices, retail and mixed-use, with immersive tours.',
    url: '/commercial',
    type: 'website',
  },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Page N of the list lives at ?page=N with its own canonical and title. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return pagedMetadata(BASE, '/commercial', pageFrom(await searchParams) ?? 1);
}

export default async function Commercial({ searchParams }: Props) {
  const page = pageFrom(await searchParams);
  if (page === null) notFound();
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesNavbar />
      <PropertiesPage lockedCategory="COMMERCIAL" heading="Commercial property for sale" initialPage={page} basePath="/commercial" />
      <PropertyDirectory page={page} title="All commercial developments in Kenya" path="/commercial" label="Commercial property for sale in Kenya" category="COMMERCIAL" />
    </div>
  );
}
