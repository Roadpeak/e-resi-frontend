import type { Metadata } from 'next';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { DevelopersDirectory } from '../../../components/directory/DevelopersDirectory';

export const metadata: Metadata = {
  title: 'Top Property Developers in Kenya',
  description: 'Browse property developer listings across Kenya — verified, KYB-approved developers with live developments you can tour in cinematic, 3D and VR, and how to reach them directly.',
  alternates: { canonical: '/developers' },
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[#f0f0f2]">
      <PropertiesNavbar />
      <DevelopersDirectory />
    </div>
  );
}
