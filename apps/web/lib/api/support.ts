import { apiClient } from './client';

export type SupportCategory = 'ENQUIRY' | 'HELP' | 'ACCOUNT' | 'BILLING' | 'PARTNERSHIP' | 'OTHER';
export type SupportStatus = 'OPEN' | 'RESOLVED';

export const SUPPORT_CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: 'ENQUIRY', label: 'General enquiry' },
  { value: 'HELP', label: 'I need help' },
  { value: 'ACCOUNT', label: 'My account' },
  { value: 'BILLING', label: 'Billing & payments' },
  { value: 'PARTNERSHIP', label: 'Partnerships' },
  { value: 'OTHER', label: 'Something else' },
];

export const categoryLabel = (c: string) =>
  SUPPORT_CATEGORIES.find((x) => x.value === c)?.label ?? c;

export interface SupportMessage {
  id: string;
  threadId: string;
  fromAdmin: boolean;
  authorId?: string | null;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface SupportThread {
  id: string;
  userId?: string | null;
  role?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  category: SupportCategory;
  subject: string;
  status: SupportStatus;
  pageUrl?: string | null;
  userUnread: boolean;
  lastMessageAt: string;
  createdAt: string;
  /** Present on the thread a visitor just created — their key back in. */
  accessToken?: string;
  messages?: SupportMessage[];
  lastMessage?: SupportMessage | null;
}

export interface AdminSupportThread extends SupportThread {
  adminUnread: boolean;
  messageCount?: number;
  delivery?: 'ACCOUNT' | 'EMAIL' | 'PHONE';
  emailed?: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    role: string;
    developerProfile?: { id: string; companyName?: string | null; logoUrl?: string | null } | null;
    agentProfile?: { id: string; displayName?: string | null; logoUrl?: string | null; photoUrl?: string | null } | null;
  } | null;
}

export interface NewSupportThread {
  category?: SupportCategory;
  subject?: string;
  message: string;
  name?: string;
  email?: string;
  phone?: string;
  pageUrl?: string;
}

// ── Visitor access tokens ────────────────────────────────────────────────────
//
// A visitor without an account gets a token per conversation. It lives in this
// browser (and in the link of every reply email) so they can come back to it.

const TOKENS_KEY = 'eresi.support.tokens';

export function visitorTokens(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

export function rememberVisitorToken(threadId: string, token: string) {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify({ ...visitorTokens(), [threadId]: token }));
  } catch {
    /* private mode — the reply email link still works */
  }
}

const tokenHeader = (threadId: string, token?: string) => {
  const t = token ?? visitorTokens()[threadId];
  return t ? { headers: { 'x-support-token': t } } : undefined;
};

export const supportApi = {
  create: (body: NewSupportThread) => apiClient.post<SupportThread>('/support/threads', body),
  mine: () => apiClient.get<SupportThread[]>('/support/threads/mine'),
  unread: () => apiClient.get<{ count: number }>('/support/unread'),
  get: (id: string, token?: string) =>
    apiClient.get<SupportThread>(`/support/threads/${id}`, tokenHeader(id, token)),
  reply: (id: string, body: string) =>
    apiClient.post<SupportThread>(`/support/threads/${id}/messages`, { body }, tokenHeader(id)),
};

export const adminSupportApi = {
  list: (params: { filter?: string; q?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.filter) qs.set('filter', params.filter);
    if (params.q) qs.set('q', params.q);
    if (params.page) qs.set('page', String(params.page));
    return apiClient.get<{
      items: AdminSupportThread[];
      total: number;
      page: number;
      limit: number;
      counts: { open: number; unread: number; resolved: number };
    }>(`/admin/support?${qs.toString()}`);
  },
  unread: () => apiClient.get<{ count: number }>('/admin/support/unread'),
  get: (id: string) => apiClient.get<AdminSupportThread>(`/admin/support/${id}`),
  reply: (id: string, body: string) =>
    apiClient.post<AdminSupportThread>(`/admin/support/${id}/messages`, { body }),
  setStatus: (id: string, status: SupportStatus) =>
    apiClient.patch<AdminSupportThread>(`/admin/support/${id}/status`, { status }),
};
