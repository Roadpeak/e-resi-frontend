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

  /**
   * Mini-site branding. Separate from the listing update because these are
   * presentation settings; whiteLabel and customDomain are admin-only and
   * will 403 for a developer.
   */
  updateBranding: (
    slug: string,
    body: Partial<{
      brandColor: string;
      brandFont: string;
      heroStyle: string;
      sectionOrder: string[];
      hiddenSections: string[];
      ctaLabel: string;
      customDomain: string;
      whiteLabel: boolean;
    }>,
  ) => apiClient.patch<Property>(`/properties/${slug}/branding`, body),

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

  /**
   * Landmarks near a point, from OpenStreetMap. Suggestions only — nothing is
   * saved until the developer confirms which to keep.
   */
  nearbySuggestions: (lat: number, lng: number, radiusMetres?: number) => {
    const qs = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (radiusMetres) qs.set('radius', String(radiusMetres));
    return apiClient.get<{
      name: string;
      type: string;
      distance: string;
      distanceMetres: number;
      latitude: number;
      longitude: number;
    }[]>(`/properties/nearby-suggestions?${qs}`);
  },

  /**
   * Replace the "Nearby" landmarks on a development. Developer/admin only.
   * Sent after the property exists, since amenities are rows against a
   * property id rather than fields on the property itself.
   *
   * The bulk endpoint appends, so the existing rows are cleared first —
   * otherwise saving the list twice leaves every entry duplicated. The
   * endpoint takes a bare array, not a wrapper object.
   */
  setAmenities: async (
    slug: string,
    amenities: { name: string; type: string; distance?: string }[],
  ) => {
    await apiClient.delete<unknown>(`/properties/${slug}/amenities/all`).catch(() => undefined);
    if (!amenities.length) return;
    return apiClient.post<unknown>(`/properties/${slug}/amenities/bulk`, amenities);
  },
};
