import { apiClient } from './client';
import type { AgentKind, AgentSpecialty } from './agents';

export type PartnershipStatus = 'PENDING' | 'ACTIVE' | 'DECLINED' | 'ENDED';

export interface PartnershipDeveloper {
  id: string;
  companyName: string;
  logoUrl: string | null;
  userId?: string;
}

export interface PartnershipAgent {
  id: string;
  displayName: string;
  kind: AgentKind;
  logoUrl: string | null;
  photoUrl: string | null;
  ratingAverage: number;
  ratingCount: number;
  specialties?: AgentSpecialty[];
  userId?: string;
}

export interface Partnership {
  id: string;
  status: PartnershipStatus;
  requestedById: string;
  message: string | null;
  commissionPercent: number | null;
  respondedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  developer: PartnershipDeveloper;
  agent: PartnershipAgent;
  _count?: { assignments: number };
}

export interface PartnershipLeads {
  period: { days: number };
  totals: { inquiries: number; bookings: number; reservations: number };
  recent: {
    kind: 'INQUIRY' | 'BOOKING';
    id: string;
    name: string;
    status: string;
    property: string;
    createdAt: string;
  }[];
}

export interface PartnershipDocument {
  id: string;
  name: string;
  url: string;
  kind: string | null;
  sizeBytes: number | null;
  createdAt: string;
  uploadedBy: { firstName: string; lastName: string };
}

export interface AssignedProperty {
  id: string;
  commissionPercent: number | null;
  notes: string | null;
  assignedAt: string;
  /** The assignment's own rate, falling back to the partnership default. */
  effectiveCommission: number | null;
  property: {
    id: string; slug: string; name: string; heroImageUrl: string | null;
    city: string; neighborhood: string | null; priceFrom: number | null;
    currency: string; category: string; status: string;
  };
  partnership: {
    id: string;
    commissionPercent: number | null;
    developer: PartnershipDeveloper;
  };
}

interface Paged<T> {
  data: T[];
  meta: {
    total: number; page: number; limit: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
}

export const partnershipsApi = {
  /** My partnerships, from whichever side I sit on. */
  list: (params: { status?: PartnershipStatus; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return apiClient.get<Paged<Partnership>>(`/partnerships${qs.toString() ? `?${qs}` : ''}`);
  },

  get: (id: string) => apiClient.get<Partnership & {
    assignments: AssignedProperty[];
    documents: PartnershipDocument[];
  }>(`/partnerships/${id}`),

  /** Propose a partnership — either side may ask. */
  request: (body: {
    agentId?: string;
    developerId?: string;
    message?: string;
    commissionPercent?: number;
  }) => apiClient.post<Partnership>('/partnerships', body),

  respond: (id: string, accept: boolean) =>
    apiClient.patch<Partnership>(`/partnerships/${id}/respond`, { accept }),

  end: (id: string) => apiClient.patch<Partnership>(`/partnerships/${id}/end`),

  assignProperty: (
    id: string,
    body: { propertyId: string; commissionPercent?: number; notes?: string },
  ) => apiClient.post<unknown>(`/partnerships/${id}/properties`, body),

  unassignProperty: (id: string, propertyId: string) =>
    apiClient.delete<unknown>(`/partnerships/${id}/properties/${propertyId}`),

  /** Agent: properties assigned to me across all active partnerships. */
  myAssignments: (params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return apiClient.get<Paged<AssignedProperty>>(
      `/partnerships/my-assignments${qs.toString() ? `?${qs}` : ''}`,
    );
  },

  /**
   * What the partnership has produced. Both sides see the same figures —
   * the agent to show what they introduced, the developer to judge whether
   * the relationship is worth continuing.
   */
  leads: (id: string, days = 90) =>
    apiClient.get<PartnershipLeads>(`/partnerships/${id}/leads?days=${days}`),

  documents: (id: string) =>
    apiClient.get<PartnershipDocument[]>(`/partnerships/${id}/documents`),

  addDocument: (
    id: string,
    body: { name: string; url: string; kind?: string; sizeBytes?: number },
  ) => apiClient.post<PartnershipDocument>(`/partnerships/${id}/documents`, body),

  removeDocument: (id: string, documentId: string) =>
    apiClient.delete<unknown>(`/partnerships/${id}/documents/${documentId}`),
};
