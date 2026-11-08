import { apiClient } from './client';
import type { AgentSiteData, SiteSection } from '../../components/agent-site/types';

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

export interface AgentTemplateOption {
  key: string; name: string; description: string | null; tier: 'FREE' | 'PREMIUM';
  unlockPrice: number; free: boolean; unlocked: boolean; invoice: OpenInvoice;
}

export interface AgentTemplatesState {
  currency: string;
  current: string;
  sections: SiteSection[];
  templates: AgentTemplateOption[];
}

export interface AdminAgentTemplate {
  key: string; name: string; description: string | null; tier: 'FREE' | 'PREMIUM';
  unlockPrice: number; isActive: boolean; sortOrder: number; unlocked: number; inUse: number;
}

export const agentTemplatesAdminApi = {
  list: () => apiClient.get<{ currency: string; templates: AdminAgentTemplate[] }>('/admin/agent-templates'),
  update: (key: string, body: Partial<Pick<AdminAgentTemplate, 'tier' | 'unlockPrice' | 'isActive' | 'name' | 'description'>>) =>
    apiClient.patch<{ currency: string; templates: AdminAgentTemplate[] }>(`/admin/agent-templates/${key}`, body),
};

export type ContentType = 'TEAM' | 'TESTIMONIAL' | 'PAST_SALE' | 'FAQ' | 'SERVICE' | 'STEP' | 'POST' | 'AWARD';
export interface ContentItem { id: string; type: ContentType; data: Record<string, unknown>; slug: string | null; isPublished: boolean; sortOrder: number; updatedAt: string }
export interface ContentState { licenceNo: string | null; footerNote: string | null; items: ContentItem[] }

export const agentContentApi = {
  list: () => apiClient.get<ContentState>('/agent-site/me/content'),
  create: (type: ContentType, data: Record<string, unknown>, isPublished = true) =>
    apiClient.post<ContentState>('/agent-site/me/content', { type, data, isPublished }),
  update: (id: string, body: { data?: Record<string, unknown>; isPublished?: boolean }) =>
    apiClient.patch<ContentState>(`/agent-site/me/content/${id}`, body),
  remove: (id: string) => apiClient.delete<ContentState>(`/agent-site/me/content/${id}`),
  reorder: (type: ContentType, ids: string[]) => apiClient.put<ContentState>('/agent-site/me/content/order', { type, ids }),
  legal: (body: { licenceNo?: string | null; footerNote?: string | null }) => apiClient.patch<ContentState>('/agent-site/me/legal', body),
};

export const agentSiteApi = {
  prices: () => apiClient.get<{ currency: string; subdomain: number; customDomain: number }>('/agent-site/prices', { skipAuth: true }),
  mine: () => apiClient.get<AgentSiteSettings>('/agent-site/me'),
  preview: (template?: string) =>
    apiClient.get<AgentSiteData>(`/agent-site/me/preview${template ? `?template=${encodeURIComponent(template)}` : ''}`),
  templates: () => apiClient.get<AgentTemplatesState>('/agent-site/me/templates'),
  unlockTemplate: (key: string) => apiClient.post<AgentTemplatesState>(`/agent-site/me/templates/${key}/unlock`),
  selectTemplate: (key: string) => apiClient.put<AgentTemplatesState>('/agent-site/me/template', { key }),
  saveSections: (sections: SiteSection[]) => apiClient.put<AgentTemplatesState>('/agent-site/me/sections', { sections }),
  claim: (handle: string) => apiClient.post<AgentSiteSettings>('/agent-site/me/handle', { handle }),
  setDomain: (domain: string | null) => apiClient.put<AgentSiteSettings>('/agent-site/me/domain', { domain }),
  check: () => apiClient.post<AgentSiteSettings>('/agent-site/me/domain/check'),
  branding: (body: { tagline?: string | null; accent?: string | null; heroUrl?: string | null }) =>
    apiClient.patch<AgentSiteSettings>('/agent-site/me/branding', body),
};
