import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RentShell } from '../../../../components/rent/RentShell';
import { RentPage } from '../../../../components/rent/RentPage';

export const metadata: Metadata = {
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

export default function RentVillas() {
  return (
    <Suspense>
      <RentShell>
        <RentPage lockedCategory="VILLA" heading="Villas to rent" />
      </RentShell>
    </Suspense>
  );
}
