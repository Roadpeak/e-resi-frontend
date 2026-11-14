import type { Metadata } from 'next';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { agentsApi } from '../../../lib/api/agents';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { AgentsDirectory } from '../../../components/directory/AgentsDirectory';

/** Regenerated from live data every 5 minutes, not frozen at build time. */
export const revalidate = 300;

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

/**
 * Page 1 of the directory is fetched on the server under the exact query key
 * the directory reads, so every agent card and profile link is in the HTML.
 */
export default async function AgentsPage() {
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ['agents-directory', 'ALL', undefined, '', 1],
    queryFn: () => agentsApi.list({ page: 1, limit: 12, kind: undefined, specialty: undefined, q: undefined }),
  }).catch(() => undefined);
  return (
    <div className="min-h-screen bg-[#f0f0f2]">
      <PropertiesNavbar />
      <HydrationBoundary state={dehydrate(qc)}>
        <AgentsDirectory />
      </HydrationBoundary>
    </div>
  );
}
