import { apiClient } from './client';
import type { AgentSiteData } from '../../components/agent-site/AgentSiteView';

type OpenInvoice = { id: string; number: string; total: number; currency: string; status: string } | null;

export interface AgentSiteSettings {
  prices: { currency: string; subdomain: number; customDomain: number };
  verified: boolean;
  handle: string | null;
  activatedAt: string | null;
  invoice: OpenInvoice;
  tagline: string | null;
  accent: string | null;
  heroUrl: string | null;
  customDomain: string | null;
  domain: {
    status: 'AWAITING_PAYMENT' | 'PENDING' | 'ACTIVE' | 'ERROR' | 'MANUAL' | null;
    provider: string | null;
    nameservers: string[];
    error: string | null;
    checkedAt: string | null;
    paid: boolean;
    invoice: OpenInvoice;
    cnameTarget: string | null;
    apex: boolean | null;
  };
  url: string | null;
}

export const agentSiteApi = {
  prices: () => apiClient.get<{ currency: string; subdomain: number; customDomain: number }>('/agent-site/prices', { skipAuth: true }),
  mine: () => apiClient.get<AgentSiteSettings>('/agent-site/me'),
  preview: () => apiClient.get<AgentSiteData>('/agent-site/me/preview'),
  claim: (handle: string) => apiClient.post<AgentSiteSettings>('/agent-site/me/handle', { handle }),
  setDomain: (domain: string | null) => apiClient.put<AgentSiteSettings>('/agent-site/me/domain', { domain }),
  check: () => apiClient.post<AgentSiteSettings>('/agent-site/me/domain/check'),
  branding: (body: { tagline?: string | null; accent?: string | null; heroUrl?: string | null }) =>
    apiClient.patch<AgentSiteSettings>('/agent-site/me/branding', body),
};
