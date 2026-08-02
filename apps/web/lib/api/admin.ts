import { apiClient } from './client';

export interface AdminOverview {
  users: { total: number; byRole: Record<string, number> };
  properties: { total: number; live: number; pendingReview: number };
  rentListings: number;
  reservations: { active: number };
  revenue: { collected: number };
  queues: {
    kybPending: number;
    pendingReview: number;
    failedPayments: number;
    openInquiries: number;
  };
}

export interface AdminTrends {
  daily: { date: string; revenue: number; signups: number }[];
}

export interface AdminAttention {
  kybPending: { id: string; companyName: string; onboardingSubmittedAt?: string | null }[];
  propertiesAwaitingReview: {
    id: string;
    slug: string;
    name: string;
    createdAt: string;
    developer?: { companyName?: string | null } | null;
  }[];
  failedPayments: { id: string; amount: number; currency: string; createdAt: string }[];
}

export interface AuditRow {
  id: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  summary?: string | null;
  createdAt: string;
  actor?: { firstName?: string; lastName?: string; email?: string } | null;
}

export const adminApi = {
  overview: () => apiClient.get<AdminOverview>('/admin/overview'),
  trends: (days = 30) => apiClient.get<AdminTrends>(`/admin/trends?days=${days}`),
  attention: () => apiClient.get<AdminAttention>('/admin/attention'),
  audit: (limit = 20) =>
    apiClient.get<{ data: AuditRow[]; meta: { total: number } }>(`/admin/audit?limit=${limit}`),
};

/* ── Pricing ─────────────────────────────────────────────────────── */

export interface PricingTier {
  id: string;
  tier: string;
  label: string;
  price: number;
  currency: string;
  features: string[];
  description?: string | null;
  isActive: boolean;
}

export interface ServiceItem {
  id: string;
  key: string;
  label: string;
  category: 'CAPTURE' | 'IMMERSIVE' | 'MARKETING' | 'DESIGN';
  price: number;
  currency: string;
  unit?: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  valueType: string;
  label: string;
  description?: string | null;
  group: string;
}

export const pricingApi = {
  seed: () => apiClient.post<{ tiers: number; services: number; settings: number }>('/admin/pricing/seed'),

  tiers: () => apiClient.get<PricingTier[]>('/admin/pricing/tiers'),
  tierImpact: (tier: string) =>
    apiClient.get<{ tier: string; affectedProperties: number }>(`/admin/pricing/tiers/${tier}/impact`),
  updateTier: (id: string, body: Partial<PricingTier>) =>
    apiClient.patch<PricingTier>(`/admin/pricing/tiers/${id}`, body),

  services: () => apiClient.get<ServiceItem[]>('/admin/pricing/services'),
  createService: (body: Partial<ServiceItem>) =>
    apiClient.post<ServiceItem>('/admin/pricing/services', body),
  updateService: (id: string, body: Partial<ServiceItem>) =>
    apiClient.patch<ServiceItem>(`/admin/pricing/services/${id}`, body),
  retireService: (id: string) => apiClient.delete<ServiceItem>(`/admin/pricing/services/${id}`),

  settings: (group?: string) =>
    apiClient.get<PlatformSetting[]>(`/admin/pricing/settings${group ? `?group=${group}` : ''}`),
  updateSetting: (key: string, value: string) =>
    apiClient.patch<PlatformSetting>(`/admin/pricing/settings/${key}`, { value }),
};
