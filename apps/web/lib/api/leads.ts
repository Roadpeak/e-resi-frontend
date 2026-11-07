import { apiClient } from './client';

export type LeadChannel = 'AUTOMATIC' | 'AGENT' | 'MANUAL';
export type LeadKind = 'INQUIRY' | 'BOOKING' | 'AGENT_DEAL' | 'MANUAL' | 'VIEWER';
export type LeadSource = 'WALK_IN' | 'PHONE_CALL' | 'REFERRAL' | 'EVENT' | 'SOCIAL_MEDIA' | 'EMAIL' | 'WEBSITE' | 'AGENT' | 'OTHER';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'VIEWING' | 'NEGOTIATING' | 'WON' | 'LOST';

export interface LeadRow {
  id: string;
  kind: LeadKind;
  channel: LeadChannel;
  sourceLabel: string;
  name: string;
  email: string | null;
  phone: string | null;
  property: { id: string; name: string; slug: string } | null;
  agent: { id: string; displayName: string } | null;
  status: string;
  interest: string | null;
  message: string | null;
  budget: number | null;
  addedBy: string | null;
  /** Raw source key — hand-added leads only. */
  source?: LeadSource;
  /** Page viewers: what the capture endpoint needs. */
  viewer?: { userId: string; propertyId: string; views: number };
  createdAt: string;
}

export interface LeadInput {
  name: string;
  email?: string;
  phone?: string;
  propertyId?: string;
  source?: LeadSource;
  status?: LeadStatus;
  interest?: string;
  budget?: number;
  notes?: string;
}

export const LEAD_SOURCES: { key: LeadSource; label: string }[] = [
  { key: 'WALK_IN', label: 'Walk-in' },
  { key: 'PHONE_CALL', label: 'Phone call' },
  { key: 'REFERRAL', label: 'Referral' },
  { key: 'EVENT', label: 'Event or show' },
  { key: 'SOCIAL_MEDIA', label: 'Social media' },
  { key: 'EMAIL', label: 'Email' },
  { key: 'WEBSITE', label: 'Website' },
  { key: 'AGENT', label: 'Agent' },
  { key: 'OTHER', label: 'Other' },
];

export const LEAD_STATUSES: { key: LeadStatus; label: string }[] = [
  { key: 'NEW', label: 'New' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'QUALIFIED', label: 'Qualified' },
  { key: 'VIEWING', label: 'Viewing' },
  { key: 'NEGOTIATING', label: 'Negotiating' },
  { key: 'WON', label: 'Won' },
  { key: 'LOST', label: 'Lost' },
];

export const leadsApi = {
  list: () => apiClient.get<{ leads: LeadRow[]; properties: { id: string; name: string; slug: string }[] }>('/leads'),
  create: (body: LeadInput) => apiClient.post<{ id: string }>('/leads', body),
  update: (id: string, body: Partial<LeadInput>) => apiClient.patch<{ id: string }>(`/leads/${id}`, body),
  remove: (id: string) => apiClient.delete<{ message: string }>(`/leads/${id}`),
};
