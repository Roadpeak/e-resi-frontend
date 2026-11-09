import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RentShell } from '../../../../components/rent/RentShell';
import { RentPage } from '../../../../components/rent/RentPage';

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

export default function RentCommercial() {
  return (
    <Suspense>
      <RentShell>
        <RentPage lockedCategory="COMMERCIAL" heading="Commercial space to rent" />
      </RentShell>
    </Suspense>
  );
}
