import type { Metadata } from 'next';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { AgentsDirectory } from '../../../components/directory/AgentsDirectory';

export const metadata: Metadata = {
  title: 'Property Agents in Kenya',
  description:
    'Find verified property agents in Kenya — letting and sales agents for apartments, villas and commercial space, rated by the clients they have worked with.',
  alternates: { canonical: '/agents' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Property Agents in Kenya — E-resi',
    description:
      'Verified letting and sales agents across Kenya, filterable by what they handle and ranked by client ratings.',
    url: '/agents',
    type: 'website',
  },
};

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-[#f0f0f2]">
      <PropertiesNavbar />
      <AgentsDirectory />
    </div>
  );
}
