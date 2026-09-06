import { apiClient } from './client';
import { referralPayload } from '../analytics/referral';

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
  // The referring agent rides along on every booking, attached here rather
  // than at each form so no template's booking flow can forget it — this is
  // what routes the viewing to the agent instead of the developer.
  create: (payload: CreateBookingPayload) =>
    apiClient.post<{ id: string }>('/bookings', { ...payload, ...referralPayload() }),
};
