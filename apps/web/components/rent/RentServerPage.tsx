import { Suspense } from 'react';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { rentListingsApi, toRentListing } from '../../lib/api/rent-listings';
import { RentShell } from './RentShell';
import { RentPage } from './RentPage';
import { JsonLd, breadcrumbs, itemList } from '../seo/JsonLd';

/**
 * A rent browse page, rendered on the server with its listings already in
 * the HTML, so search engines see every rental and its link on the first
 * crawl instead of an empty frame that fills in after JavaScript runs.
 *
 * The prefetch uses the exact query key RentPage asks for with default
 * filters, so the browser picks the data up without a second request.
 */
export async function RentServerPage({
  category, heading, path, label,
}: { category?: string; heading?: string; path: string; label: string }) {
  const qc = new QueryClient();
  const params = { limit: 100, ...(category ? { category } : {}) };
  await qc.prefetchQuery({
    queryKey: ['rent-listings', params],
    queryFn: async () => {
      const res = await rentListingsApi.list(params);
      return { items: res.data.map(toRentListing), total: res.meta.total };
    },
  });
  const items = qc.getQueryData<{ items: ReturnType<typeof toRentListing>[] }>(['rent-listings', params])?.items ?? [];

  const trail = [{ name: 'Home', path: '/' }, { name: 'Rent', path: '/rent' }];
  if (path !== '/rent') trail.push({ name: label, path });

  return (
    <>
      <JsonLd data={itemList(label, items.map((l) => ({ url: `/rent/${l.slug}`, name: l.name, image: l.heroImageUrl })))} />
      <JsonLd data={breadcrumbs(trail)} />
      <HydrationBoundary state={dehydrate(qc)}>
        <Suspense>
          <RentShell>
            <RentPage lockedCategory={category} heading={heading} />
          </RentShell>
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
