import { apiClient } from './client';

export interface AppNotification {
  id: string;
  type:
    | 'INQUIRY_RECEIVED' | 'INQUIRY_REPLIED' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED'
    | 'RESERVATION_UPDATED' | 'RESERVATION_EXPIRING' | 'PAYMENT_RECEIVED'
    | 'KYB_APPROVED' | 'KYB_REJECTED' | 'PROPERTY_PUBLISHED' | 'GENERAL';
  title: string;
  body: string;
  read: boolean;
  resourceId?: string | null;
  resourceType?: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  data: AppNotification[];
  meta: { total: number };
  unreadCount: number;
}

export const notificationsApi = {
  list: (limit = 8) => apiClient.get<NotificationsResponse>(`/notifications?limit=${limit}`),
  markRead: (id: string) => apiClient.patch<AppNotification>(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch<{ message: string }>('/notifications/read-all'),
};
