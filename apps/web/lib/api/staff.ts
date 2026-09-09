import { apiClient } from './client';

export type StaffStatus = 'INVITED' | 'ACTIVE' | 'REVOKED';

export interface StaffMember {
  id: string;
  email: string;
  name?: string | null;
  pages: string[];
  status: StaffStatus;
  createdAt: string;
  user?: { firstName: string; lastName: string; lastLoginAt?: string | null } | null;
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
    apiClient.get<{ email: string; name?: string | null; pages: string[]; company: string; logoUrl?: string | null }>(
      `/staff/invite/${token}`,
    ),
  acceptInvite: (token: string, body: { password: string; firstName: string; lastName: string }) =>
    apiClient.post<{ email: string }>(`/staff/invite/${token}/accept`, body),
};
