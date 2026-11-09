import type { Metadata } from 'next';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { PropertiesPage } from '../../../components/marketplace/PropertiesPage';
import { PropertyDirectory } from '../../../components/marketplace/PropertyDirectory';

export const metadata: Metadata = {
  title: 'Buy Apartments in Kenya',
  description:
    "Buy apartments in Kenya. Browse verified apartment developments with cinematic, 3D and VR tours — see unit-level availability, floor plans and pricing before you buy.",
  alternates: { canonical: '/apartments' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Buy Apartments in Kenya — E-resi',
    description:
      'Verified apartment developments across Kenya, with cinematic, 3D and VR tours and unit-level availability.',
    url: '/apartments',
    type: 'website',
  },
};

export default function Apartments() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesNavbar />
      <PropertiesPage lockedCategory="APARTMENT" heading="Apartments for sale" />
      <PropertyDirectory title="All apartment developments in Kenya" path="/apartments" label="Apartments for sale in Kenya" category="APARTMENT" />
    </div>
  );
}
