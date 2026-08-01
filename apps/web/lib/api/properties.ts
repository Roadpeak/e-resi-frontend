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
  bedrooms?: number;
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
    // These were stripped while the API rejected them; it now filters and sorts
    // on all of them, so pass them through.
    const { has3DTour, hasVRTour, ...rest } = query;
    const params: Record<string, unknown> = {
      ...rest,
      ...(has3DTour ? { has3DTour: 'true' } : {}),
      ...(hasVRTour ? { hasVRTour: 'true' } : {}),
    };
    return apiClient.get<PaginatedProperties>(`/properties${toQueryString(params)}`);
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
