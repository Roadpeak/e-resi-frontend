import type { Metadata } from 'next';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { developersApi } from '../../../lib/api/developers';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { DevelopersDirectory } from '../../../components/directory/DevelopersDirectory';

/** Regenerated from live data every 5 minutes, not frozen at build time. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Top Property Developers in Kenya',
  description: 'Browse property developer listings across Kenya — verified, KYB-approved developers with live developments you can tour in cinematic, 3D and VR, and how to reach them directly.',
  alternates: { canonical: '/developers' },
};

/** Page 1 prefetched under the directory's own query key: every developer link is in the HTML. */
export default async function DevelopersPage() {
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ['developers-directory', 1],
    queryFn: () => developersApi.list({ page: 1, limit: 12 }),
  }).catch(() => undefined);
  return (
    <div className="min-h-screen bg-[#f0f0f2]">
      <PropertiesNavbar />
      <HydrationBoundary state={dehydrate(qc)}>
        <DevelopersDirectory />
      </HydrationBoundary>
    </div>
  );
}
