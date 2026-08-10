import type { Metadata } from 'next';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { PropertiesPage } from '../../../components/marketplace/PropertiesPage';

export const metadata: Metadata = {
  title: 'Buy Villas in Kenya',
  description:
    "Buy villas in Kenya. Browse verified villa developments and gated communities with cinematic, 3D and VR tours — see plot sizes, layouts and pricing before you buy.",
  alternates: { canonical: '/villas' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Buy Villas in Kenya — E-resi',
    description:
      'Verified villa developments and gated communities across Kenya, with cinematic, 3D and VR tours.',
    url: '/villas',
    type: 'website',
  },
};

export default function Villas() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesNavbar />
      <PropertiesPage lockedCategory="VILLA" heading="Villas for sale" />
    </div>
  );
}
