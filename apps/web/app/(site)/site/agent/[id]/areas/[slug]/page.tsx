import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { AgentSiteData, AreaGuide } from '../../../../../../../components/agent-site/types';
import { AreaView } from '../../../../../../../components/agent-site/AreaView';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const body = await res.json();
    return (body?.data ?? body) as T;
  } catch {
    return null;
  }
}

type Params = { params: Promise<{ id: string; slug: string }> };

async function load(id: string, slug: string) {
  return Promise.all([
    get<AreaGuide>(`/agent-site/${encodeURIComponent(id)}/areas/${encodeURIComponent(slug)}`),
    get<AgentSiteData>(`/agent-site/${encodeURIComponent(id)}`),
  ]);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id, slug } = await params;
  const [area, site] = await load(id, slug);
  if (!area || !site) return { title: 'Not found' };
  const description = area.summary ?? area.tagline ?? `Living in ${area.name}: homes, prices and what's nearby.`;
  return {
    title: `Living in ${area.name} — ${site.agent.displayName}`,
    description,
    openGraph: { title: `Living in ${area.name}`, description, ...(area.coverUrl && { images: [area.coverUrl] }) },
  };
}

/** One area guide on an agent website (see proxy.ts for /areas/<slug> on agent hosts). */
export default async function AgentAreaPage({ params }: Params) {
  const { id, slug } = await params;
  const [area, site] = await load(id, slug);
  if (!area || !site) notFound();
  return <AreaView area={area} site={site} />;
}
