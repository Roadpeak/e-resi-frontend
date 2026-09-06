import { apiClient } from './client';
import type { RoomProperty } from './client-rooms';

/**
 * The mandate pool — developers open developments to the verified agent
 * network with commission stated up front; agents raise their hands;
 * accepting creates the partnership and assignment in one step.
 */

export type MandateStatus = 'OPEN' | 'CLOSED';
export type MandateRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';

export interface MandateProperty extends RoomProperty {
  status: string;
}

export interface MandateRequest {
  id: string;
  status: MandateRequestStatus;
  message: string | null;
  respondedAt: string | null;
  createdAt: string;
  agent?: {
    id: string;
    displayName: string;
    kind: 'COMPANY' | 'INDIVIDUAL';
    photoUrl: string | null;
    logoUrl: string | null;
    ratingAverage: number;
    ratingCount: number;
    dealsCompleted: number;
    serviceAreas: string[];
    specialties: string[];
  };
}

export interface Mandate {
  id: string;
  commissionPercent: number;
  notes: string | null;
  status: MandateStatus;
  maxAgents: number | null;
  createdAt: string;
  property: MandateProperty;
  developer?: { id: string; companyName: string; logoUrl: string | null };
  /** Agent view: my own request on this mandate, if I made one. */
  myRequest?: { id: string; status: MandateRequestStatus; createdAt: string } | null;
  acceptedAgents?: number;
  /** Developer view: the request queue. */
  requests?: MandateRequest[];
}

export const mandatesApi = {
  // Agent side
  listOpen: () => apiClient.get<Mandate[]>('/mandates/open'),
  request: (mandateId: string, message?: string) =>
    apiClient.post<MandateRequest>(`/mandates/${mandateId}/requests`, { message }),
  withdraw: (mandateId: string) =>
    apiClient.patch<MandateRequest>(`/mandates/${mandateId}/withdraw`, {}),

  // Developer side
  listMine: () => apiClient.get<Mandate[]>('/mandates/mine'),
  publish: (body: { propertyId: string; commissionPercent: number; notes?: string; maxAgents?: number }) =>
    apiClient.post<Mandate>('/mandates', body),
  close: (mandateId: string) => apiClient.patch<Mandate>(`/mandates/${mandateId}/close`, {}),
  respond: (requestId: string, accept: boolean) =>
    apiClient.patch<MandateRequest>(`/mandates/requests/${requestId}/respond`, { accept }),
};
