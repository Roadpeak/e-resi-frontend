import { apiClient } from './client';
import { referralPayload } from '../analytics/referral';

export type ReservationStage =
  | 'RESERVED'
  | 'AGREEMENT_SIGNED'
  | 'DEPOSIT_PAID'
  | 'FINAL_PAYMENT'
  | 'TITLE_TRANSFERRED'
  | 'CANCELLED';

export interface Reservation {
  id: string;
  stage: ReservationStage;
  expiresAt: string;
  createdAt: string;
  unit: {
    id: string;
    name: string;
    floor?: number | null;
    bedrooms: number;
    sqm?: number | null;
    price: number;
    currency: string;
    property: { slug: string; name: string; heroImageUrl: string };
  };
}

export interface ReservationsResponse {
  data: Reservation[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const reservationsApi = {
  listMine: (params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return apiClient.get<ReservationsResponse>(`/reservations/mine${q ? `?${q}` : ''}`);
  },

  /**
   * Reserve a sale unit. Carries the referring agent, like every other lead
   * path — a reservation is the closest thing to a sale, so it is the most
   * valuable attribution of the three.
   */
  create: (unitId: string, expiresAt?: string) =>
    apiClient.post<Reservation>('/reservations', {
      unitId,
      ...(expiresAt && { expiresAt }),
      ...referralPayload(),
    }),

  /** Reserve one of a rent listing's unit types. */
  reserveRentUnit: (rentUnitId: string) =>
    apiClient.post<unknown>(`/reservations/rent-units/${rentUnitId}`, referralPayload()),

  cancel: (id: string) => apiClient.delete<Reservation>(`/reservations/${id}`),
};
