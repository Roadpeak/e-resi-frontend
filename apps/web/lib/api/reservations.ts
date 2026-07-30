import { apiClient } from './client';

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

  cancel: (id: string) => apiClient.delete<Reservation>(`/reservations/${id}`),
};
