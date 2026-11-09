import type { Metadata } from 'next';
import { RentServerPage } from '../../../../components/rent/RentServerPage';

export const metadata: Metadata = {
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

export default function RentApartments() {
  return <RentServerPage path="/rent/apartments" label="Apartments to rent" category="APARTMENT" heading="Apartments to rent" />;
}
