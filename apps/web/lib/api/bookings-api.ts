import { apiClient } from './client';

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  type: 'PHYSICAL' | 'VIRTUAL';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  message?: string | null;
  meetingUrl?: string | null;
  createdAt: string;
  property: { id: string; name: string; slug: string };
}

export interface BookingsResponse {
  data: Booking[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const bookingsListApi = {
  /** Agent: viewings that arrived through my shared links — mine to run. */
  listForAgent: (params: { page?: number; limit?: number; status?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.status) qs.set('status', params.status.toUpperCase());
    const q = qs.toString();
    return apiClient.get<BookingsResponse>(`/bookings/agent${q ? `?${q}` : ''}`);
  },

  listForDeveloper: (params: { page?: number; limit?: number; status?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.status) qs.set('status', params.status.toUpperCase());
    const q = qs.toString();
    return apiClient.get<BookingsResponse>(`/bookings/developer${q ? `?${q}` : ''}`);
  },

  listMine: (params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return apiClient.get<BookingsResponse>(`/bookings/mine${q ? `?${q}` : ''}`);
  },

  updateStatus: (id: string, status: string, meetingUrl?: string) =>
    apiClient.patch<Booking>(`/bookings/${id}/status`, { status, meetingUrl }),

  cancel: (id: string) => apiClient.patch<Booking>(`/bookings/${id}/cancel`),
};
