import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AgentSite } from '../../../../../components/agent-site/AgentSite';
import type { AgentSiteData } from '../../../../../components/agent-site/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function load(id: string): Promise<AgentSiteData | null> {
  try {
    const res = await fetch(`${API_BASE}/agent-site/${encodeURIComponent(id)}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const body = await res.json();
    return (body?.data ?? body) as AgentSiteData;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await load(id);
  if (!data) return { title: 'Not found' };
  const title = data.agent.displayName;
  const description = data.agent.siteTagline
    ?? `Developments and homes listed by ${data.agent.displayName}.`;
  const image = data.agent.siteHeroUrl ?? data.listings[0]?.heroImageUrl ?? data.agent.logoUrl ?? undefined;
  return {
    title,
    description,
    ...(data.url && { alternates: { canonical: data.url } }),
    openGraph: { title, description, ...(image && { images: [image] }), ...(data.url && { url: data.url }) },
  };
}

/** An agent's branded website: <handle>.e-resi.com or their own domain (see proxy.ts). */
export default async function AgentSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await load(id);
  if (!data) notFound();
  return <AgentSite data={data} />;
}
