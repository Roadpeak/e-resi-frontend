import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageFrom, pagedMetadata } from '../../../../lib/seo/paging';
import { RentServerPage } from '../../../../components/rent/RentServerPage';

const BASE: Metadata = {
  title: 'Rent Commercial Property in Kenya',
  description:
    'Rent commercial property in Kenya. Browse offices, retail units and mixed-use space to let, with cinematic and 3D tours, floor plates and transparent monthly pricing.',
  alternates: { canonical: '/rent/commercial' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Rent Commercial Property in Kenya — E-resi',
    description:
      'Offices, retail and mixed-use space to let across Kenya, with immersive tours and live availability.',
    url: '/rent/commercial',
    type: 'website',
  },
};

// Rendered per request so the listings (and the ?view= state) are in the HTML.
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Page N lives at ?page=N with its own canonical and title. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return pagedMetadata(BASE, '/rent/commercial', pageFrom(await searchParams) ?? 1);
}

export default async function RentCommercial({ searchParams }: Props) {
  const page = pageFrom(await searchParams);
  if (page === null) notFound();
  return <RentServerPage page={page} path="/rent/commercial" label="Commercial space to rent" category="COMMERCIAL" heading="Commercial space to rent" />;
}
