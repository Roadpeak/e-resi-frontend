import { apiClient } from './client';

/**
 * Agent link traffic — what each agent's shared links delivered.
 *
 * One shape serves both chairs: the developer's report spans every agent on
 * their properties, the agent's spans every property for just themself.
 */

export interface ReferralRow {
  agentId: string;
  propertyId: string;
  views: number;
  tourStarts: number;
  inquiries: number;
  bookings: number;
  reservations: number;
  agent: { id: string; displayName: string; photoUrl: string | null; logoUrl: string | null } | null;
  property: { id: string; name: string; slug: string } | null;
}

export interface ReferralReport {
  days: number;
  rows: ReferralRow[];
}

export const referralsApi = {
  forDeveloper: (days = 90) =>
    apiClient.get<ReferralReport>(`/analytics/referrals/developer?days=${days}`),
  forAgent: (days = 90) =>
    apiClient.get<ReferralReport>(`/analytics/referrals/agent?days=${days}`),
};

/** A signed-in customer seen browsing — the quiet-interest lead source. */
export interface InterestedViewer {
  userId: string;
  propertyId: string;
  views: number;
  lastViewedAt: string | null;
  alreadyLead: boolean;
  user: { id: string; firstName: string; lastName: string; email: string; phone: string | null; role: string } | null;
  property: { id: string; name: string; slug: string } | null;
}

export const viewersApi = {
  list: (days = 30) =>
    apiClient.get<{ days: number; rows: InterestedViewer[] }>(`/analytics/viewers?days=${days}`),
  capture: (userId: string, propertyId: string) =>
    apiClient.post<{ kind: 'deal' | 'inquiry'; id: string }>('/analytics/viewers/capture', {
      userId,
      propertyId,
    }),
};
