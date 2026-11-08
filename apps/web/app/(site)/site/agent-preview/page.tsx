'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { agentSiteApi } from '../../../../lib/api/agent-site';
import { AgentSite } from '../../../../components/agent-site/AgentSite';

/**
 * The signed-in agent's own site in any template, bought or not — loaded in
 * an iframe on the Website page (and in a new tab), so fixed headers and
 * full-screen heroes behave exactly as they will on the live site.
 */
function Preview() {
  const template = useSearchParams().get('template') ?? undefined;
  const { data, error } = useQuery({
    queryKey: ['agent-site-preview', template],
    queryFn: () => agentSiteApi.preview(template),
    retry: false,
  });
  if (error) return <p className="p-10 text-[14px] text-[#5f6368]">Sign in as an agent to preview your website.</p>;
  if (!data) return <p className="p-10 text-[14px] text-[#5f6368]">Loading preview…</p>;
  return <AgentSite data={data} template={template ?? data.template} preview />;
}

export default function AgentPreviewPage() {
  return <Suspense fallback={null}><Preview /></Suspense>;
}
