import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageFrom, pagedMetadata, propertyFiltersFrom } from '../../../lib/seo/paging';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { PropertiesPage } from '../../../components/marketplace/PropertiesPage';
import { PropertyDirectory } from '../../../components/marketplace/PropertyDirectory';

const BASE: Metadata = {
  title: "Buy Kenya's Top Properties",
  description: "Buy Kenya's top properties. Discover verified developments with immersive cinematic, 3D and VR tours — invest in Kenya's properties digitally, from anywhere.",
  alternates: { canonical: '/properties' },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Page N of the list lives at ?page=N with its own canonical and title. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return pagedMetadata(BASE, '/properties', pageFrom(await searchParams) ?? 1);
}

export default async function Properties({ searchParams }: Props) {
  const sp = await searchParams;
  const page = pageFrom(sp);
  if (page === null) notFound();
  const initialFilters = propertyFiltersFrom(sp);
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesNavbar />
      <PropertiesPage initialPage={page} basePath="/properties" initialFilters={initialFilters} />
      <PropertyDirectory page={page} title="All developments for sale in Kenya" path="/properties" label="Properties for sale in Kenya" />
    </div>
  );
}
