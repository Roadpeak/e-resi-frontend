import { apiClient } from './client';
import type { User } from '../types';
import type { AgentSpecialty } from './agents';

export type InviteKind = 'AGENT' | 'DEVELOPER';
export type InviteState = 'pending' | 'opened' | 'signed_up' | 'revoked';

export interface PartnerInvite {
  id: string;
  code: string;
  url: string;
  kind: InviteKind;
  status: 'ACTIVE' | 'REVOKED';
  state: InviteState;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  message: string;
  agentKind: 'COMPANY' | 'INDIVIDUAL' | null;
  referrer: string;
  notes: string | null;
  createdBy: string | null;
  openedAt: string | null;
  openCount: number;
  signedUpAt: string | null;
  signedUpUser: {
    id: string; name: string; email: string; role: string;
    agentProfileId: string | null; developerProfileId: string | null;
  } | null;
  createdAt: string;
}

export interface InviteBucket { created: number; opened: number; signedUp: number; agents: number; developers: number; opens: number }
export interface InviteStats {
  total: InviteBucket;
  byKind: { AGENT: InviteBucket; DEVELOPER: InviteBucket };
  referrers: (InviteBucket & { referrer: string })[];
}

export interface CreateInviteInput {
  kind: InviteKind;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  message: string;
  agentKind?: 'COMPANY' | 'INDIVIDUAL';
  referrer: string;
  notes?: string;
}

/** What the welcome page gets for a link. */
export interface InviteWelcome {
  code: string;
  kind: InviteKind;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  message: string;
  agentKind: 'COMPANY' | 'INDIVIDUAL' | null;
  referrer: string;
  signedUp: boolean;
}

export interface AcceptInviteInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  name?: string;
  agentKind?: 'COMPANY' | 'INDIVIDUAL';
  specialties?: AgentSpecialty[];
}

export interface AcceptInviteResponse {
  accessToken: string;
  user: User;
  kind: InviteKind;
  siteUrl: string | null;
  next: string;
}

interface Paged<T> { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } }

export const invitesAdminApi = {
  list: (params: { kind?: InviteKind | ''; referrer?: string; state?: InviteState | 'all' | ''; q?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '' && v !== 'all') qs.set(k, String(v)); });
    const s = qs.toString();
    return apiClient.get<Paged<PartnerInvite>>(`/admin/invites${s ? `?${s}` : ''}`);
  },
  stats: () => apiClient.get<InviteStats>('/admin/invites/stats'),
  get: (id: string) => apiClient.get<PartnerInvite>(`/admin/invites/${id}`),
  create: (body: CreateInviteInput) => apiClient.post<PartnerInvite>('/admin/invites', body),
  update: (id: string, body: Partial<CreateInviteInput> & { status?: 'ACTIVE' | 'REVOKED' }) =>
    apiClient.patch<PartnerInvite>(`/admin/invites/${id}`, body),
  remove: (id: string) => apiClient.delete<{ message: string }>(`/admin/invites/${id}`),
};

export const invitesApi = {
  open: (code: string) => apiClient.get<InviteWelcome>(`/invites/${encodeURIComponent(code)}`, { skipAuth: true }),
  accept: (code: string, body: AcceptInviteInput) =>
    apiClient.post<AcceptInviteResponse>(`/invites/${encodeURIComponent(code)}/accept`, body, { skipAuth: true }),
};
