import { apiClient } from './client';

/** An admin-curated area guide, with a live count of listed properties. */
export interface Neighborhood {
  id: string;
  slug: string;
  name: string;
  city: string;
  description?: string | null;
  heroImageUrl?: string | null;
  photos: string[];
  latitude?: number | null;
  longitude?: number | null;
  propertyCount: number;
  createdAt: string;
}

export interface NeighborhoodInput {
  name: string;
  city: string;
  description?: string;
  heroImageUrl?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
}

export const neighborhoodsApi = {
  list: (city?: string) =>
    apiClient.get<Neighborhood[]>(`/neighborhoods${city ? `?city=${encodeURIComponent(city)}` : ''}`),

  get: (slug: string) => apiClient.get<Neighborhood>(`/neighborhoods/${slug}`),

  /** Admin only. */
  create: (body: NeighborhoodInput) => apiClient.post<Neighborhood>('/neighborhoods', body),

  update: (id: string, body: Partial<NeighborhoodInput>) =>
    apiClient.patch<Neighborhood>(`/neighborhoods/${id}`, body),

  remove: (id: string) => apiClient.delete<{ message: string }>(`/neighborhoods/${id}`),
};
