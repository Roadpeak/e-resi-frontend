import type { Metadata } from 'next';
import { RentNavbar } from '../../../../components/rent/RentNavbar';
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
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #e8e6f0 0%, #f5f3ee 40%, #f0ece4 70%, #f5e8d8 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <RentNavbar />
      <RentPage lockedCategory="VILLA" heading="Villas to rent" />
    </div>
  );
}
