import { apiClient } from './client';

/**
 * Client rooms — an agent's private shortlist for one buyer, sent as a
 * single link into a WhatsApp thread. The buyer opens co-branded tours; the
 * agent reads which property the buyer kept coming back to.
 */

export interface RoomProperty {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  heroImageUrl: string | null;
  city: string;
  neighborhood: string | null;
  priceFrom: number | null;
  currency: string;
  category: string;
}

export interface ClientRoomItem {
  id: string;
  propertyId: string;
  order: number;
  note: string | null;
  property: RoomProperty;
}

export interface ClientRoom {
  id: string;
  token: string;
  title: string;
  clientName: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: ClientRoomItem[];
  _count?: { views: number };
  lastViewedAt?: string | null;
  /** Present on getOne: total room opens and clicks per property id. */
  opens?: number;
  perProperty?: Record<string, number>;
}

/** What the buyer sees — the room plus its agent's public card. */
export interface PublicClientRoom extends Omit<ClientRoom, '_count' | 'opens' | 'perProperty'> {
  agent: {
    id: string;
    displayName: string;
    kind: 'COMPANY' | 'INDIVIDUAL';
    photoUrl: string | null;
    logoUrl: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    ratingAverage: number;
    ratingCount: number;
  };
}

export const clientRoomsApi = {
  list: () => apiClient.get<ClientRoom[]>('/client-rooms'),

  create: (body: { title: string; clientName?: string; note?: string; propertyIds?: string[] }) =>
    apiClient.post<ClientRoom>('/client-rooms', body),

  getOne: (id: string) => apiClient.get<ClientRoom>(`/client-rooms/${id}`),

  update: (id: string, body: { title?: string; clientName?: string; note?: string; isActive?: boolean }) =>
    apiClient.patch<ClientRoom>(`/client-rooms/${id}`, body),

  setItems: (id: string, propertyIds: string[]) =>
    apiClient.put<ClientRoom>(`/client-rooms/${id}/items`, { propertyIds }),

  remove: (id: string) => apiClient.delete<{ message: string }>(`/client-rooms/${id}`),

  /** Unauthenticated — the link is the access. */
  publicGet: (token: string) => apiClient.get<PublicClientRoom>(`/client-rooms/public/${token}`),

  publicTrack: (token: string, propertyId: string) =>
    apiClient.post<{ ok: boolean }>(`/client-rooms/public/${token}/track`, { propertyId }),
};
