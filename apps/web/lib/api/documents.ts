import { apiClient } from './client';

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  sizeBytes?: number | null;
  createdAt: string;
  reservation?: {
    id: string;
    stage: string;
    unit: { name: string; property: { slug: string; name: string } };
  } | null;
}

export interface DocumentsResponse {
  data: Document[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const documentsApi = {
  listMine: (params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return apiClient.get<DocumentsResponse>(`/documents/mine${q ? `?${q}` : ''}`);
  },
};
