import type { Metadata } from 'next';
import { PropertiesNavbar } from '../../../../components/marketplace/PropertiesNavbar';
import { MapLocationsPage } from '../../../../components/directory/MapLocationsPage';

export const metadata: Metadata = {
  title: 'Map of Developments',
  description: 'Explore live developments across Kenya on the map, with pricing and photos.',
};

export default function MapLocationsRoute() {
  return (
    <div className="min-h-screen bg-[#f0f0f2]">
      <PropertiesNavbar />
      <MapLocationsPage />
    </div>
  );
}
