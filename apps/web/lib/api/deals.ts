import { apiClient } from './client';
import type { PartnershipAgent, PartnershipDeveloper } from './partnerships';

/**
 * The deal pipeline — attribution turned into money.
 *
 * A Deal tracks one client's journey from introduction to keys, with the
 * commission running beside it as its own state machine. Stage and money are
 * deliberately separate: an SPA gets signed with the commission unpaid for
 * months, and surfacing that gap — to both sides, with timestamps — is the
 * whole feature.
 */

export type DealStage = 'LEAD' | 'VIEWING' | 'RESERVED' | 'SPA_SIGNED' | 'COMPLETED' | 'LOST';
export type CommissionStatus = 'NONE' | 'ACCRUED' | 'DUE' | 'PAID' | 'DISPUTED';

/** Display order along the pipeline; LOST sits apart as the failure exit. */
export const DEAL_STAGES: DealStage[] = ['LEAD', 'VIEWING', 'RESERVED', 'SPA_SIGNED', 'COMPLETED'];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  LEAD: 'Lead',
  VIEWING: 'Viewing',
  RESERVED: 'Reserved',
  SPA_SIGNED: 'SPA signed',
  COMPLETED: 'Completed',
  LOST: 'Lost',
};

export const COMMISSION_LABELS: Record<CommissionStatus, string> = {
  NONE: 'Not set',
  ACCRUED: 'Accrued',
  DUE: 'Due',
  PAID: 'Paid',
  DISPUTED: 'Disputed',
};

export interface DealProperty {
  id: string;
  slug: string;
  name: string;
  heroImageUrl: string | null;
  city: string;
}

export interface Deal {
  id: string;
  partnershipId: string;
  stage: DealStage;
  stageChangedAt: string;
  lostReason: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  saleValue: number | null;
  currency: string;
  commissionPercent: number | null;
  commissionAmount: number | null;
  commissionStatus: CommissionStatus;
  commissionDueAt: string | null;
  commissionPaidAt: string | null;
  disputeReason: string | null;
  notes: string | null;
  createdAt: string;
  property: DealProperty;
  unit: { id: string; name: string; price: number; currency: string } | null;
  agent: PartnershipAgent;
  developer: PartnershipDeveloper;
}

export interface DealEvent {
  id: string;
  kind: string;
  summary: string;
  createdAt: string;
  actor: { firstName: string; lastName: string };
}

export interface DealSummary {
  openDeals: number;
  stageCounts: Partial<Record<DealStage, number>>;
  commissionTotals: Partial<Record<CommissionStatus, { count: number; amount: number }>>;
}

export const dealsApi = {
  summary: () => apiClient.get<DealSummary>('/deals/summary'),

  list: (params: { page?: number; limit?: number; stage?: DealStage; commissionStatus?: CommissionStatus } = {}) =>
    apiClient.get<{ data: Deal[]; meta: { total: number; totalPages: number } }>('/deals', params as Record<string, unknown>),

  getOne: (id: string) => apiClient.get<Deal & { events: DealEvent[] }>(`/deals/${id}`),

  create: (body: {
    partnershipId: string;
    propertyId: string;
    unitId?: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    notes?: string;
    inquiryId?: string;
    bookingId?: string;
    reservationId?: string;
  }) => apiClient.post<Deal>('/deals', body),

  updateStage: (id: string, stage: DealStage, lostReason?: string) =>
    apiClient.patch<Deal>(`/deals/${id}/stage`, { stage, lostReason }),

  /** Developer-only: the sale value is their price sheet. */
  setCommission: (id: string, body: { saleValue?: number; commissionPercent?: number }) =>
    apiClient.patch<Deal>(`/deals/${id}/commission`, body),

  /** Developer marks due/paid; agent disputes or withdraws a dispute. */
  setCommissionStatus: (id: string, status: CommissionStatus, reason?: string) =>
    apiClient.patch<Deal>(`/deals/${id}/commission/status`, { status, reason }),

  addNote: (id: string, note: string) =>
    apiClient.post<Deal & { events: DealEvent[] }>(`/deals/${id}/notes`, { note }),
};
