import { apiClient } from './client';

export interface AppNotification {
  id: string;
  type:
    | 'SYSTEM_ANNOUNCEMENT'
    | 'INQUIRY_RECEIVED' | 'INQUIRY_REPLIED' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED'
    | 'RESERVATION_UPDATED' | 'RESERVATION_EXPIRING' | 'PAYMENT_RECEIVED'
    | 'INVOICE_ISSUED' | 'INVOICE_REMINDER' | 'RECEIPT_ISSUED' | 'PAYMENT_METHOD_UPDATED'
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
  meta: { total: number; page?: number; totalPages?: number };
  unreadCount: number;
}

export const notificationsApi = {
  list: (limit = 8, opts: { page?: number; unreadOnly?: boolean } = {}) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (opts.page) qs.set('page', String(opts.page));
    if (opts.unreadOnly) qs.set('unreadOnly', 'true');
    return apiClient.get<NotificationsResponse>(`/notifications?${qs}`);
  },
  markRead: (id: string) => apiClient.patch<AppNotification>(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch<{ message: string }>('/notifications/read-all'),
};
