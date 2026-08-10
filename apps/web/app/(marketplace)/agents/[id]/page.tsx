import type { Metadata } from 'next';
import { PropertiesNavbar } from '../../../../components/marketplace/PropertiesNavbar';
import { AgentProfile } from '../../../../components/directory/AgentProfile';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Built from the public API so the agent's own name is the page title, rather
 * than a generic one. Falls back gracefully — an unlisted agent must not leak
 * its existence through metadata when the page itself 404s.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.e-resi.com/api';
  try {
    const res = await fetch(`${base}/agents/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error('not listed');
    const json = await res.json();
    const agent = json?.data ?? json;
    const kindLabel = agent.kind === 'COMPANY' ? 'Property agency' : 'Property agent';
    return {
      title: `${agent.displayName} — ${kindLabel}`,
      description:
        agent.bio?.slice(0, 160)
        ?? `${agent.displayName}, a verified ${kindLabel.toLowerCase()} on E-resi${agent.location ? ` in ${agent.location}` : ' in Kenya'}.`,
      alternates: { canonical: `/agents/${id}` },
      openGraph: {
        siteName: 'E-resi',
        title: `${agent.displayName} — E-resi`,
        url: `/agents/${id}`,
        type: 'website',
      },
    };
  } catch {
    return { title: 'Agent' };
  }
}

export default async function AgentDetailRoute({ params }: Props) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-[#f0f0f2]">
      <PropertiesNavbar />
      <AgentProfile agentId={id} />
    </div>
  );
}
