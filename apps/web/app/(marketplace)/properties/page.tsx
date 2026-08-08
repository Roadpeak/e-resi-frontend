import type { Metadata } from 'next';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { PropertiesPage } from '../../../components/marketplace/PropertiesPage';

export const metadata: Metadata = {
  title: "Buy Kenya's Top Properties",
  description: "Buy Kenya's top properties. Discover verified developments with immersive cinematic, 3D and VR tours — invest in Kenya's properties digitally, from anywhere.",
  alternates: { canonical: '/properties' },
};

export default function Properties() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesNavbar />
      <PropertiesPage />
    </div>
  );
}
