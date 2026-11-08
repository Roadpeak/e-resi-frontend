'use client';

import type { ComponentType } from 'react';
import type { AgentSiteData } from './types';
import { AgentSiteView } from './AgentSiteView';
import { HavenTemplate } from './templates/Haven';
import { AtelierTemplate } from './templates/Atelier';
import { MeridianTemplate } from './templates/Meridian';

/**
 * Agent-website templates by key. The API owns the catalogue (free/premium,
 * price, active) under the same keys; a key with no design here renders
 * Classic, so a template can be announced in admin before it ships.
 */
export const AGENT_TEMPLATES: Record<string, ComponentType<{ data: AgentSiteData }>> = {
  CLASSIC: AgentSiteView,
  HAVEN: HavenTemplate,
  ATELIER: AtelierTemplate,
  MERIDIAN: MeridianTemplate,
};

export function AgentSite({ data, template }: { data: AgentSiteData; template?: string | null }) {
  const Template = AGENT_TEMPLATES[template ?? data.template ?? 'CLASSIC'] ?? AgentSiteView;
  return <Template data={data} />;
}
