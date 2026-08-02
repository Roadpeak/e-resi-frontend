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
