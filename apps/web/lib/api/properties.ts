import { apiClient } from './client';
import type { Property } from '../types';

export interface PropertiesQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  city?: string;
  neighborhood?: string;
  priceMin?: number;
  priceMax?: number;
  has3DTour?: boolean;
  hasVRTour?: boolean;
  sortBy?: string;
}

export interface PaginatedProperties {
  data: Property[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function toQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      qs.set(k, String(v));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const propertiesApi = {
  /** Developer: own properties only (any status, incl. drafts). */
  myListings: (query: PropertiesQuery = {}) => {
    const { limit, page, status, category, search } = query;
    return apiClient.get<PaginatedProperties>(
      `/properties/my/listings${toQueryString({ limit, page, status, category, q: search })}`,
    );
  },

  list: (query: PropertiesQuery = {}) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sortBy, priceMin, priceMax, has3DTour, hasVRTour, search, ...supported } = query;
    return apiClient.get<PaginatedProperties>(`/properties${toQueryString(supported as Record<string, unknown>)}`);
  },

  get: (slug: string) => apiClient.get<Property>(`/properties/${slug}`),

  submitInquiry: (
    slug: string,
    payload: { name: string; email: string; phone?: string; message: string; interestedInUnit?: string },
  ) => apiClient.post<unknown>(`/properties/${slug}/inquiries`, payload),

  submitBooking: (
    slug: string,
    payload: {
      name: string;
      email: string;
      phone: string;
      preferredDate: string;
      preferredTime: string;
      type: 'PHYSICAL' | 'VIRTUAL';
      message?: string;
      unitId?: string;
    },
  ) => apiClient.post<unknown>(`/properties/${slug}/bookings`, payload),
};
