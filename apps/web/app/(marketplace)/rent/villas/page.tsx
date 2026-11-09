import type { Metadata } from 'next';
import { RentServerPage } from '../../../../components/rent/RentServerPage';

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

// Rendered per request so the listings (and the ?view= state) are in the HTML.
export const dynamic = 'force-dynamic';

export default function RentVillas() {
  return <RentServerPage path="/rent/villas" label="Villas to rent" category="VILLA" heading="Villas to rent" />;
}
