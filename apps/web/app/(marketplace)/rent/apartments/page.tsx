import type { Metadata } from 'next';
import { RentNavbar } from '../../../../components/rent/RentNavbar';
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
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #e8e6f0 0%, #f5f3ee 40%, #f0ece4 70%, #f5e8d8 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <RentNavbar />
      <RentPage lockedCategory="APARTMENT" heading="Apartments to rent" />
    </div>
  );
}
