import type { Metadata } from 'next';
import { RentServerPage } from '../../../../components/rent/RentServerPage';

export const metadata: Metadata = {
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

export default function RentCommercial() {
  return <RentServerPage path="/rent/commercial" label="Commercial space to rent" category="COMMERCIAL" heading="Commercial space to rent" />;
}
