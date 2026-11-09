import { Suspense } from 'react';
import { RentShell } from '../../../components/rent/RentShell';
import { RentPage } from '../../../components/rent/RentPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rent in Nairobi — e-resi',
  description: 'Browse furnished and unfurnished apartments, villas and offices for rent in Nairobi with cinematic and 3D tours.',
};

export default function Rent() {
  return (
    <Suspense>
      <RentShell>
        <RentPage />
      </RentShell>
    </Suspense>
  );
}
