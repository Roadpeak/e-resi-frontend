import { apiClient } from './client';

/** An admin-curated area guide, with a live count of listed properties. */
export interface Neighborhood {
  id: string;
  slug: string;
  name: string;
  city: string;
  description?: string | null;
  lifestyle?: string | null;
  schools?: string | null;
  transport?: string | null;
  heroImageUrl?: string | null;
  photos: string[];
  latitude?: number | null;
  longitude?: number | null;
  propertyCount: number;
  createdAt: string;
}

/** Auto-detected surroundings, straight from OpenStreetMap. */
export interface AreaAmenities {
  total: number;
  categories: { key: string; label: string; count: number; names: string[] }[];
  unavailable?: boolean;
}

export interface NeighborhoodInput {
  name: string;
  city: string;
  description?: string;
  lifestyle?: string;
  schools?: string;
  transport?: string;
  heroImageUrl?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
}

export const neighborhoodsApi = {
  list: (city?: string) =>
    apiClient.get<Neighborhood[]>(`/neighborhoods${city ? `?city=${encodeURIComponent(city)}` : ''}`),

  get: (slug: string) => apiClient.get<Neighborhood>(`/neighborhoods/${slug}`),

  amenities: (slug: string) => apiClient.get<AreaAmenities>(`/neighborhoods/${slug}/amenities`),

  /** Admin only. */
  create: (body: NeighborhoodInput) => apiClient.post<Neighborhood>('/neighborhoods', body),

  update: (id: string, body: Partial<NeighborhoodInput>) =>
    apiClient.patch<Neighborhood>(`/neighborhoods/${id}`, body),

  remove: (id: string) => apiClient.delete<{ message: string }>(`/neighborhoods/${id}`),
};
