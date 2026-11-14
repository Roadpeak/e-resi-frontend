import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageFrom, pagedMetadata } from '../../../../lib/seo/paging';
import { RentServerPage } from '../../../../components/rent/RentServerPage';

const BASE: Metadata = {
  title: 'Rent Apartments in Kenya',
  description:
    'Rent apartments in Kenya. Browse furnished and unfurnished apartments with cinematic and 3D tours, live availability per unit type, and transparent monthly pricing.',
  alternates: { canonical: '/rent/apartments' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Rent Apartments in Kenya — E-resi',
    description:
      'Furnished and unfurnished apartments to rent across Kenya, with immersive tours and live availability.',
    url: '/rent/apartments',
    type: 'website',
  },
};

// Rendered per request so the listings (and the ?view= state) are in the HTML.
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Page N lives at ?page=N with its own canonical and title. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return pagedMetadata(BASE, '/rent/apartments', pageFrom(await searchParams) ?? 1);
}

export default async function RentApartments({ searchParams }: Props) {
  const page = pageFrom(await searchParams);
  if (page === null) notFound();
  return <RentServerPage page={page} path="/rent/apartments" label="Apartments to rent" category="APARTMENT" heading="Apartments to rent" />;
}
