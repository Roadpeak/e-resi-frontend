import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { apiGet } from '../../../../lib/seo/server-fetch';
import { PropertiesNavbar } from '../../../../components/marketplace/PropertiesNavbar';
import { NeighbourhoodPage } from '../../../../components/marketplace/NeighbourhoodPage';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.e-resi.com/api';
  try {
    const res = await fetch(`${base}/neighborhoods/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    const hood = json?.data ?? json;
    return {
      title: `${hood.name}, ${hood.city} — Area Guide`,
      description:
        hood.description?.slice(0, 160)
        ?? `Living in ${hood.name}, ${hood.city}: photos, location and the properties listed there on e-resi.`,
      alternates: { canonical: `/neighbourhoods/${slug}` },
    };
  } catch {
    return { title: 'Neighbourhood' };
  }
}

export default async function NeighbourhoodRoute({ params }: Props) {
  const { slug } = await params;
  const r = await apiGet<unknown>(`/neighborhoods/${slug}`, 300);
  if (r.status === 'missing') notFound();
  // The guide is fetched here under the page's own query key, so its text is
  // in the HTML rather than appearing only after the page's JavaScript runs.
  const qc = new QueryClient();
  if (r.status === 'ok') qc.setQueryData(['neighborhood', slug], r.data);
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesNavbar />
      <HydrationBoundary state={dehydrate(qc)}>
        <NeighbourhoodPage slug={slug} />
      </HydrationBoundary>
    </div>
  );
}
