import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RentShell } from '../../../../components/rent/RentShell';
import { RentPage } from '../../../../components/rent/RentPage';

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

export default function RentApartments() {
  return (
    <Suspense>
      <RentShell>
        <RentPage lockedCategory="APARTMENT" heading="Apartments to rent" />
      </RentShell>
    </Suspense>
  );
}
