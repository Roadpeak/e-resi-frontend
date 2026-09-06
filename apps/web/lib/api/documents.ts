import { apiClient } from './client';

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  sizeBytes?: number | null;
  createdAt: string;
  /** The developer asked the buyer to sign this one. */
  requiresSignature?: boolean;
  /** Signed copies the buyer uploaded against this document. */
  signedVersions?: Document[];
  parentId?: string | null;
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

  /** Developer: the document library of one property. */
  listForProperty: (propertyId: string) =>
    apiClient.get<Document[]>(`/documents/properties/${propertyId}`),

  /** Documents shared on a purchase — originals with their signed copies. */
  listForReservation: (reservationId: string) =>
    apiClient.get<Document[]>(`/documents/reservations/${reservationId}`),

  /**
   * Record an uploaded file. Pass propertyId for the property library,
   * reservationId (+ requiresSignature) to share into a purchase, or
   * parentId to answer a signature request with the signed copy.
   */
  create: (body: {
    name: string;
    url: string;
    type: string;
    sizeBytes?: number;
    propertyId?: string;
    reservationId?: string;
    requiresSignature?: boolean;
    parentId?: string;
  }) => apiClient.post<Document>('/documents', body),

  remove: (id: string) => apiClient.delete<{ message: string }>(`/documents/${id}`),
};
