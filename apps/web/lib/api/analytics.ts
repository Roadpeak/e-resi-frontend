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

  propertyViews: (propertyId: string) =>
    apiClient.get<{ totalViews: number; uniqueVisitors: number }>(`/analytics/property/${propertyId}`),
};
