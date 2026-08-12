import { apiClient } from './client';

export interface DeveloperStats {
  properties: { total: number; active: number };
  inquiries: { last30Days: number };
  bookings: { pending: number };
  reservations: { active: number };
}

export const analyticsApi = {
  developerStats: () =>
    apiClient.get<DeveloperStats>('/analytics/developer/overview'),

  developerEngagement: (days = 7) =>
    apiClient.get<{
      daily: { date: string; views: number; inquiries: number; bookings: number }[];
      sources: { source: string; count: number }[];
    }>(`/analytics/developer/engagement?days=${days}`),

  propertyViews: (propertyId: string) =>
    apiClient.get<{ totalViews: number; uniqueVisitors: number }>(`/analytics/property/${propertyId}`),

  /** Full engagement report for one development's mini-site. */
  miniSiteReport: (slug: string, days = 30) =>
    apiClient.get<MiniSiteReport>(`/analytics/properties/${slug}?days=${days}`),
};

export interface MiniSiteReport {
  property: { id: string; slug: string; name: string };
  period: { days: number; since: string };
  headline: {
    views: number;
    uniqueVisitors: number;
    tourStarts: number;
    tourCompletes: number;
    shares: number;
    inquiries: number;
    bookings: number;
    saved: number;
    tourOpenRate: number;
    tourEngagementRate: number;
    averageTourSeconds: number;
  };
  tours: { tour: string; starts: number; completes: number; averageSeconds: number }[];
  sources: { source: string; visits: number }[];
  topUnits: { unitId: string; name: string; views: number; uniqueViewers: number }[];
}
