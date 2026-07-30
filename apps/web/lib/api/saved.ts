import { apiClient } from './client';

export interface SavedPropertyItem {
  id: string;
  createdAt: string;
  property: {
    id: string;
    name: string;
    slug: string;
    heroImageUrl: string;
    priceFrom: number;
    priceTo: number;
    city: string;
    status: string;
  };
}

export interface SavedPropertiesResponse {
  data: SavedPropertyItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const savedApi = {
  list: () => apiClient.get<SavedPropertiesResponse>('/saved-properties'),
  save: (slug: string) => apiClient.post<SavedPropertyItem>(`/saved-properties/${slug}`),
  remove: (slug: string) => apiClient.delete<void>(`/saved-properties/${slug}`),
  isSaved: (slug: string) => apiClient.get<{ saved: boolean }>(`/saved-properties/${slug}/status`),
};
