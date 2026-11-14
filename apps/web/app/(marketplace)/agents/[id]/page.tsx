import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { PropertiesNavbar } from '../../../../components/marketplace/PropertiesNavbar';
import { AgentProfile } from '../../../../components/directory/AgentProfile';
import { JsonLd, SITE_URL, breadcrumbs } from '../../../../components/seo/JsonLd';
import { apiGet, snippet } from '../../../../lib/seo/server-fetch';
import type { Agent } from '../../../../lib/api/agents';

interface Props {
  params: Promise<{ id: string }>;
}

const kindLabel = (a: Agent) => (a.kind === 'COMPANY' ? 'Property agency' : 'Property agent');

/**
 * The agent's own name is the page title. An unlisted or unverified agent
 * 404s from the API, so the page 404s too, without saying which.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = await apiGet<Agent>(`/agents/${id}`, 300);
  if (r.status !== 'ok') return { title: 'Agent', robots: { index: false, follow: true } };
  const a = r.data;
  const where = a.location ? ` in ${a.location}` : ' in Kenya';
  const title = `${a.displayName} — ${kindLabel(a)}${where}`;
  const description = snippet(a.bio)
    ?? `${a.displayName}, a verified ${kindLabel(a).toLowerCase()}${where}. Homes for sale and to rent, reviews and contact on E-resi.`;
  return {
    title,
    description,
    alternates: { canonical: `/agents/${id}` },
    openGraph: { siteName: 'E-resi', title: `${a.displayName} — E-resi`, description, url: `/agents/${id}`, type: 'profile' },
    twitter: { card: 'summary', title: `${a.displayName} — E-resi`, description },
  };
}

/**
 * Schema.org description of the agent. Deliberately no telephone: agents'
 * numbers are shown only after a visitor leaves theirs, and structured data
 * would hand them out regardless.
 */
function agentSchema(a: Agent, id: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${SITE_URL}/agents/${id}#agent`,
    name: a.displayName,
    url: `${SITE_URL}/agents/${id}`,
    ...(a.logoUrl || a.photoUrl ? { image: a.logoUrl ?? a.photoUrl } : {}),
    ...(a.bio ? { description: snippet(a.bio, 300) } : {}),
    address: { '@type': 'PostalAddress', ...(a.location ? { addressLocality: a.location } : {}), addressCountry: 'KE' },
    ...(a.serviceAreas?.length ? { areaServed: a.serviceAreas.map((name) => ({ '@type': 'Place', name })) } : {}),
    ...(a.ratingCount > 0 ? {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(a.ratingAverage.toFixed(1)), reviewCount: a.ratingCount, bestRating: 5, worstRating: 1 },
    } : {}),
  };
}

export default async function AgentDetailRoute({ params }: Props) {
  const { id } = await params;
  const r = await apiGet<Agent>(`/agents/${id}`, 300);
  if (r.status === 'missing') notFound();

  // Prefetch what the profile shows, under the same query keys it reads, so
  // the name, bio, listings and reviews are in the HTML Google receives.
  const qc = new QueryClient();
  if (r.status === 'ok') {
    qc.setQueryData(['agent', id], r.data);
    const [props, rentals, partners, reviews] = await Promise.all([
      apiGet<unknown>(`/agents/${id}/properties`, 300),
      apiGet<unknown>(`/agents/${id}/rentals`, 300),
      apiGet<unknown>(`/agents/${id}/partners`, 300),
      apiGet<unknown>(`/agents/${id}/reviews?limit=20`, 300),
    ]);
    if (props.status === 'ok') qc.setQueryData(['agent', id, 'properties'], props.data);
    if (rentals.status === 'ok') qc.setQueryData(['agent', id, 'rentals'], rentals.data);
    if (partners.status === 'ok') qc.setQueryData(['public-partners', 'agent', id], partners.data);
    if (reviews.status === 'ok') qc.setQueryData(['agent-reviews', id], reviews.data);
  }

  return (
    <div className="min-h-screen bg-[#f0f0f2]">
      {r.status === 'ok' && (
        <>
          <JsonLd data={agentSchema(r.data, id)} />
          <JsonLd data={breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Agents', path: '/agents' },
            { name: r.data.displayName, path: `/agents/${id}` },
          ])} />
        </>
      )}
      <PropertiesNavbar />
      <HydrationBoundary state={dehydrate(qc)}>
        <AgentProfile agentId={id} />
      </HydrationBoundary>
    </div>
  );
}
