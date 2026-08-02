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

/* ── People ──────────────────────────────────────────────────────── */

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  phone?: string | null;
  emailVerified: boolean;
  isActive: boolean;
  suspendedAt?: string | null;
  suspendedReason?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  developerProfile?: { id: string; companyName?: string | null; kybStatus?: string } | null;
}

export interface AdminDeveloper {
  id: string;
  companyName: string;
  kybStatus: string;
  createdAt: string;
  user?: { id: string; email: string; firstName?: string; lastName?: string; isActive: boolean } | null;
  _count?: { properties: number; rentListings: number };
}

interface Paged<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const peopleApi = {
  users: (params: { q?: string; role?: string; status?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return apiClient.get<Paged<AdminUser>>(`/admin/users${qs.toString() ? `?${qs}` : ''}`);
  },
  user: (id: string) => apiClient.get<AdminUser>(`/admin/users/${id}`),
  suspend: (id: string, suspended: boolean, reason?: string) =>
    apiClient.patch<AdminUser>(`/admin/users/${id}/suspend`, { suspended, reason }),
  setRole: (id: string, role: string) =>
    apiClient.patch<AdminUser>(`/admin/users/${id}/role`, { role }),
  verify: (id: string) => apiClient.patch<AdminUser>(`/admin/users/${id}/verify`),

  developers: (params: { kybStatus?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return apiClient.get<Paged<AdminDeveloper>>(`/admin/developers${qs.toString() ? `?${qs}` : ''}`);
  },
  reviewKyb: (profileId: string, status: string, notes?: string) =>
    apiClient.patch<AdminDeveloper>(`/admin/developers/${profileId}/kyb`, { status, notes }),
};

/* ── Properties ──────────────────────────────────────────────────── */

export interface AdminProperty {
  id: string;
  slug: string;
  name: string;
  status: string;
  city?: string | null;
  neighborhood?: string | null;
  heroImageUrl?: string | null;
  isFeatured: boolean;
  priceFrom?: number | null;
  currency: string;
  latitude?: number | null;
  longitude?: number | null;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  developer?: { id: string; companyName?: string | null } | null;
  _count?: { units: number; media: number; inquiries: number };
}

export const adminPropertiesApi = {
  list: (params: { status?: string; q?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return apiClient.get<{ data: AdminProperty[]; meta: { total: number; totalPages: number } }>(
      `/admin/properties${qs.toString() ? `?${qs}` : ''}`,
    );
  },
  review: (slug: string, decision: 'APPROVE' | 'REJECT', notes?: string) =>
    apiClient.patch<AdminProperty>(`/admin/properties/${slug}/review`, { decision, notes }),
  setStatus: (slug: string, status: string) =>
    apiClient.patch<AdminProperty>(`/admin/properties/${slug}/status`, { status }),
  feature: (slug: string, isFeatured: boolean) =>
    apiClient.patch<AdminProperty>(`/admin/properties/${slug}/feature`, { isFeatured }),
};
