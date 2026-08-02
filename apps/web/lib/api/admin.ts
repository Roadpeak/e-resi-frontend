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

  /**
   * Change the platform billing currency. `rate` multiplies catalog prices;
   * 1 relabels without converting. Existing invoices are never touched.
   */
  setCurrency: (currency: string, rate?: number, useLiveRate?: boolean) =>
    apiClient.post<{
      currency: string; rate: number; rateSource: string; rateFetchedAt: string | null;
      tiersUpdated: number; servicesUpdated: number; pricesConverted: number;
      listingFee: number;
    }>('/admin/pricing/currency', { currency, rate, useLiveRate }),

  /** Live FX rate, with the time it was fetched so the UI can flag staleness. */
  exchangeRate: (from: string, to: string) =>
    apiClient.get<{
      rate: number; from: string; to: string;
      fetchedAt: string; source: string; stale: boolean;
    }>(`/admin/pricing/exchange-rate?from=${from}&to=${to}`),

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

/** Full profile behind the KYB review screen. */
export interface AdminDeveloperDetail extends AdminDeveloper {
  logoUrl?: string | null;
  description?: string | null;
  website?: string | null;
  establishedYear?: number | null;
  completedProjects?: number;
  kybReviewedAt?: string | null;
  onboarding?: Record<string, unknown> | null;
  onboardingSubmittedAt?: string | null;
  /** Uploaded document references, keyed by document type. */
  kybDocuments?: Record<string, string> | null;
  reviewNotes?: string | null;
  user?: {
    id: string; email: string; firstName?: string; lastName?: string;
    phone?: string | null; role: string; isActive: boolean; emailVerified: boolean;
    avatarUrl?: string | null; createdAt: string; lastLoginAt?: string | null;
    suspendedAt?: string | null; suspendedReason?: string | null;
  } | null;
  properties?: { id: string; name: string; slug: string; status: string; city?: string | null; createdAt: string }[];
  rentListings?: { id: string; name: string; slug: string; status: string; createdAt: string }[];
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
  developer: (profileId: string) =>
    apiClient.get<AdminDeveloperDetail>(`/admin/developers/${profileId}`),
  reviewKyb: (profileId: string, status: string, notes?: string) =>
    apiClient.patch<AdminDeveloper>(`/admin/developers/${profileId}/kyb`, { status, notes }),
  remove: (id: string) => apiClient.delete<{ message: string }>(`/admin/users/${id}`),
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
  remove: (slug: string) =>
    apiClient.delete<{ message: string }>(`/admin/properties/${slug}`),
};

/* ── Billing & production ────────────────────────────────────────── */

export interface BillingSummary {
  collected: number;
  collectedCount: number;
  pending: number;
  pendingCount: number;
  failedCount: number;
  refunded: number;
  recurring: {
    liveProperties: number;
    feePerProperty: number;
    currency: string;
    monthly: number;
  };
}

export interface AdminPayment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  reference?: string | null;
  createdAt: string;
  user?: { id: string; email: string; firstName?: string; lastName?: string } | null;
}

/** One ordered production service. The API still names the status field
 *  `status`; `orderStatus` remains the request field name on updates. */
export interface ProductionOrder {
  id: string;
  serviceKey: string;
  label: string;
  amount: number;
  currency: string;
  status: string;
  /** What the developer asked for when ordering. */
  preferredDate?: string | null;
  instructions?: string | null;
  accessInfo?: string | null;
  scheduledAt?: string | null;
  deliveredAt?: string | null;
  crewNotes?: string | null;
  createdAt: string;
  property?: {
    slug: string;
    name: string;
    city?: string | null;
    heroImageUrl?: string | null;
    developer?: { id?: string; companyName?: string | null } | null;
  } | null;
}

export const adminBillingApi = {
  summary: () => apiClient.get<BillingSummary>('/admin/billing/summary'),
  payments: (params: { status?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return apiClient.get<{ data: AdminPayment[]; meta: { total: number } }>(
      `/admin/billing/payments${qs.toString() ? `?${qs}` : ''}`,
    );
  },
  refund: (id: string) => apiClient.post<AdminPayment>(`/admin/billing/payments/${id}/refund`),
  retry: (id: string) => apiClient.post<AdminPayment>(`/admin/billing/payments/${id}/retry`),

  orders: (status?: string) =>
    apiClient.get<ProductionOrder[]>(
      `/admin/billing/production-orders${status ? `?status=${status}` : ''}`,
    ),
  updateOrder: (id: string, body: { orderStatus?: string; scheduledAt?: string; crewNotes?: string }) =>
    apiClient.patch<ProductionOrder>(`/admin/billing/production-orders/${id}`, body),
  /** Create order rows for services selected before per-service orders existed. */
  backfillOrders: () =>
    apiClient.post<{ properties: number; created: number }>(
      '/admin/billing/production-orders/backfill',
    ),
};

/* ── Operations ──────────────────────────────────────────────────── */

export interface AdminRental {
  id: string;
  name: string;
  slug: string;
  status: string;
  priceFrom?: number | null;
  currency: string;
  createdAt: string;
  developer?: { companyName?: string | null } | null;
  property?: { slug: string; name: string } | null;
  rentUnits?: { id: string; label: string; floor?: number | null; available: number; total: number; pricePerMonth: number }[];
}

export interface AdminInquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
  property?: { slug: string; name: string; developer?: { companyName?: string | null } | null } | null;
}

export interface AdminBooking {
  id: string;
  status: string;
  scheduledAt?: string | null;
  createdAt: string;
  property?: { slug: string; name: string; developer?: { companyName?: string | null } | null } | null;
  user?: { email: string; firstName?: string; lastName?: string } | null;
}

export interface AdminConversation {
  id: string;
  subject?: string | null;
  lastMessageAt: string;
  /** What the conversation is about — a sale listing or a rental. */
  property?: { slug: string; name: string } | null;
  rentListing?: { slug: string; name: string } | null;
  customer?: { id: string; email: string; firstName?: string; lastName?: string } | null;
  developer?: { id: string; email: string; firstName?: string; lastName?: string } | null;
  _count?: { messages: number };
}

export interface AdminFunnel {
  funnel: { views: number; inquiries: number; bookings: number; reservations: number };
  topProperties: {
    views: number;
    property?: { slug: string; name: string; developer?: { companyName?: string | null } | null } | null;
  }[];
}

function qs(params: Record<string, unknown>) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') s.set(k, String(v));
  });
  return s.toString() ? `?${s}` : '';
}

interface Meta { meta: { total: number; totalPages: number } }

export const adminOpsApi = {
  rentals: (p: { status?: string; limit?: number } = {}) =>
    apiClient.get<{ data: AdminRental[] } & Meta>(`/admin/rentals${qs(p)}`),
  setRentalStatus: (id: string, status: string) =>
    apiClient.patch<AdminRental>(`/admin/rentals/${id}/status`, { status }),

  inquiries: (p: { status?: string; limit?: number } = {}) =>
    apiClient.get<{ data: AdminInquiry[] } & Meta>(`/admin/inquiries${qs(p)}`),
  bookings: (p: { status?: string; limit?: number } = {}) =>
    apiClient.get<{ data: AdminBooking[] } & Meta>(`/admin/bookings${qs(p)}`),

  conversations: (p: { limit?: number } = {}) =>
    apiClient.get<{ data: AdminConversation[] } & Meta>(`/admin/conversations${qs(p)}`),
  transcript: (id: string) =>
    apiClient.get<{
      conversation: AdminConversation;
      messages: { id: string; body: string; createdAt: string; sender?: { firstName?: string; lastName?: string; email?: string } | null }[];
    }>(`/admin/conversations/${id}/messages`),

  funnel: (days = 30) => apiClient.get<AdminFunnel>(`/admin/funnel?days=${days}`),
};

/* ── System ──────────────────────────────────────────────────────── */

export interface SystemHealth {
  checks: { name: string; ok: boolean; detail: string }[];
  uptimeSeconds: number;
  environment: string;
  counts: { users: number; properties: number; payments: number };
}

export interface DeliveredNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  user?: { email: string; role: string } | null;
}

export const adminSystemApi = {
  health: () => apiClient.get<SystemHealth>('/admin/system/health'),
  /**
   * Change the platform billing currency. `rate` multiplies catalog prices;
   * 1 relabels without converting. Existing invoices are never touched.
   */
  setCurrency: (currency: string, rate?: number, useLiveRate?: boolean) =>
    apiClient.post<{
      currency: string; rate: number; rateSource: string; rateFetchedAt: string | null;
      tiersUpdated: number; servicesUpdated: number; pricesConverted: number;
      listingFee: number;
    }>('/admin/pricing/currency', { currency, rate, useLiveRate }),

  /** Live FX rate, with the time it was fetched so the UI can flag staleness. */
  exchangeRate: (from: string, to: string) =>
    apiClient.get<{
      rate: number; from: string; to: string;
      fetchedAt: string; source: string; stale: boolean;
    }>(`/admin/pricing/exchange-rate?from=${from}&to=${to}`),

  settings: (group?: string) =>
    apiClient.get<PlatformSetting[]>(`/admin/system/settings${group ? `?group=${group}` : ''}`),
  updateSetting: (key: string, value: string) =>
    apiClient.patch<PlatformSetting>(`/admin/system/settings/${key}`, { value }),
  notifications: () => apiClient.get<DeliveredNotification[]>('/admin/system/notifications'),
  broadcast: (body: { role?: string; title: string; body: string }) =>
    apiClient.post<{ sent: number }>('/admin/system/broadcast', body),
};
