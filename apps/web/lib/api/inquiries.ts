import { apiClient } from './client';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'NEW' | 'READ' | 'REPLIED' | 'CLOSED';
  reply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  property: { id: string; name: string; slug: string };
  unit?: { id: string; name: string } | null;
  /**
   * Set once a reply turned this lead into a chat thread. Absent for guest
   * inquiries — with no account there is nobody to open a thread with, so
   * those stay email-only.
   */
  conversationId?: string | null;
  /** The agent who introduced this lead, when one did. */
  agent?: { id: string; displayName: string } | null;
}

export interface InquiriesResponse {
  data: Inquiry[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const inquiriesApi = {
  listForDeveloper: (params: { page?: number; limit?: number; status?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.status && params.status !== 'all') qs.set('status', params.status.toUpperCase());
    const q = qs.toString();
    return apiClient.get<InquiriesResponse>(`/inquiries/developer${q ? `?${q}` : ''}`);
  },

  listMine: (params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return apiClient.get<InquiriesResponse>(`/inquiries/mine${q ? `?${q}` : ''}`);
  },

  reply: (id: string, reply: string) =>
    apiClient.patch<Inquiry>(`/inquiries/${id}/reply`, { reply }),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<Inquiry>(`/inquiries/${id}/status`, { status }),
};
