import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageFrom, pagedMetadata } from '../../../../lib/seo/paging';
import { RentServerPage } from '../../../../components/rent/RentServerPage';

const BASE: Metadata = {
  title: 'Rent Villas in Kenya',
  description:
    'Rent villas in Kenya. Browse furnished and unfurnished villas and townhouses in gated communities, with cinematic and 3D tours and live availability.',
  alternates: { canonical: '/rent/villas' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Rent Villas in Kenya — E-resi',
    description:
      'Villas and gated-community homes to rent across Kenya, with immersive tours and live availability.',
    url: '/rent/villas',
    type: 'website',
  },
};

// Rendered per request so the listings (and the ?view= state) are in the HTML.
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Page N lives at ?page=N with its own canonical and title. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return pagedMetadata(BASE, '/rent/villas', pageFrom(await searchParams) ?? 1);
}

export default async function RentVillas({ searchParams }: Props) {
  const page = pageFrom(await searchParams);
  if (page === null) notFound();
  return <RentServerPage page={page} path="/rent/villas" label="Villas to rent" category="VILLA" heading="Villas to rent" />;
}
