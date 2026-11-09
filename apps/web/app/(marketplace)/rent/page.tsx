import { RentServerPage } from '../../../components/rent/RentServerPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Houses & Apartments for Rent in Nairobi',
  description:
    'Houses, apartments, villas and offices for rent in Nairobi and across Kenya. Furnished and unfurnished, with photos, video and 3D tours, monthly rent and live availability.',
  alternates: { canonical: '/rent' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Houses & Apartments for Rent in Nairobi — E-resi',
    description: 'Furnished and unfurnished rentals in Nairobi with tours, monthly rent and live availability.',
    url: '/rent',
    type: 'website',
  },
};

// Rendered per request so the listings (and the ?view= state) are in the HTML.
export const dynamic = 'force-dynamic';

export default function Rent() {
  return <RentServerPage path="/rent" label="Rentals in Nairobi" />;
}
