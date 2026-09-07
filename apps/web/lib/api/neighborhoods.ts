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
  /** Present on the detail endpoint: live stats of what is listed there. */
  market?: {
    total: number;
    priceMin: number | null;
    priceMax: number | null;
    priceMedian: number | null;
    byCategory: Record<string, number>;
  };
  createdAt: string;
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

  /** Admin only. */
  create: (body: NeighborhoodInput) => apiClient.post<Neighborhood>('/neighborhoods', body),

  update: (id: string, body: Partial<NeighborhoodInput>) =>
    apiClient.patch<Neighborhood>(`/neighborhoods/${id}`, body),

  remove: (id: string) => apiClient.delete<{ message: string }>(`/neighborhoods/${id}`),
};
