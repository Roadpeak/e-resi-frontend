import { apiClient } from './client';

export type StaffStatus = 'INVITED' | 'ACTIVE' | 'REVOKED';

export interface StaffMember {
  id: string;
  email: string;
  name?: string | null;
  pages: string[];
  status: StaffStatus;
  createdAt: string;
  user?: { firstName: string; lastName: string; lastLoginAt?: string | null; avatarUrl?: string | null } | null;
}

export interface StaffActivityLog {
  id: string;
  method: string;
  path: string;
  area?: string | null;
  createdAt: string;
}

export interface StaffActivityReport {
  staff: StaffMember;
  stats: {
    totalOps30d: number;
    activeDays30d: number;
    byArea: Record<string, number>;
    rating: number;
  };
  logs: StaffActivityLog[];
}

export const staffApi = {
  pages: () => apiClient.get<{ pages: string[] }>('/staff/pages'),
  list: () => apiClient.get<StaffMember[]>('/staff'),
  invite: (body: { email: string; name?: string; pages: string[] }) =>
    apiClient.post<StaffMember>('/staff/invite', body),
  update: (id: string, body: { pages?: string[]; name?: string }) =>
    apiClient.patch<StaffMember>(`/staff/${id}`, body),
  revoke: (id: string) => apiClient.delete<{ message: string }>(`/staff/${id}`),
  activity: (id: string) => apiClient.get<StaffActivityReport>(`/staff/${id}/activity`),

  /** Public: the accept-invite pages. */
  inviteDetails: (token: string) =>
    apiClient.get<{ email: string; name?: string | null; pages: string[]; kind?: 'DEVELOPER' | 'AGENT'; company: string; logoUrl?: string | null }>(
      `/staff/invite/${token}`,
    ),
  acceptInvite: (token: string, body: { password: string; firstName: string; lastName: string; avatarUrl: string }) =>
    apiClient.post<{ email: string }>(`/staff/invite/${token}/accept`, body),

  /** Public: the invitee's profile photo, authorised by the invite token. */
  uploadInvitePhoto: async (token: string, file: File): Promise<{ url: string }> => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${base}/staff/invite/${encodeURIComponent(token)}/photo`, { method: 'POST', body: form });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error ?? json?.message ?? 'Photo upload failed');
    return (json?.data ?? json) as { url: string };
  },
};
