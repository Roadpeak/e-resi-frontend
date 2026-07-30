import { apiClient } from './client';

export interface CreateBookingPayload {
  propertySlug: string;
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  type: 'PHYSICAL' | 'VIRTUAL';
  message?: string;
}

export const bookingsApi = {
  create: (payload: CreateBookingPayload) =>
    apiClient.post<{ id: string }>('/bookings', payload),
};
