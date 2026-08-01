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
};
