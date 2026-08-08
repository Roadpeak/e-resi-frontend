import type { Metadata } from 'next';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { DevelopersDirectory } from '../../../components/directory/DevelopersDirectory';

export const metadata: Metadata = {
  title: 'Top Developers in Kenya',
  description: 'Browse verified property developers across Kenya, their live developments, and how to reach them directly.',
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[#f0f0f2]">
      <PropertiesNavbar />
      <DevelopersDirectory />
    </div>
  );
}
