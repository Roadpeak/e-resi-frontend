import type { Metadata } from 'next';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { PropertiesPage } from '../../../components/marketplace/PropertiesPage';

export const metadata: Metadata = {
  title: 'Buy Commercial Property in Kenya',
  description:
    "Buy commercial property in Kenya. Browse verified offices, retail and mixed-use developments with cinematic, 3D and VR tours — floor plates, availability and pricing in one place.",
  alternates: { canonical: '/commercial' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Buy Commercial Property in Kenya — E-resi',
    description:
      'Verified commercial developments across Kenya — offices, retail and mixed-use, with immersive tours.',
    url: '/commercial',
    type: 'website',
  },
};

export default function Commercial() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesNavbar />
      <PropertiesPage lockedCategory="COMMERCIAL" heading="Commercial property for sale" />
    </div>
  );
}
