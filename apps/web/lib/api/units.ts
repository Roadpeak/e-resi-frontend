import { apiClient } from './client';

/**
 * Unit inventory management.
 *
 * The portfolio view is the allocation board: every unit across the
 * developer's properties with who currently holds it — the live deal (client
 * and agent) or platform reservation behind a RESERVED status. That context
 * is what prevents the same unit being promised twice.
 */

export type UnitStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface PortfolioUnit {
  id: string;
  name: string;
  floor: number | null;
  bedrooms: number;
  bathrooms: number;
  sqm: number | null;
  price: number;
  currency: string;
  status: UnitStatus;
  property: { id: string; slug: string; name: string };
  /** The live deal holding this unit, when one does. */
  activeDeal: {
    id: string;
    stage: string;
    clientName: string;
    agent: { id: string; displayName: string };
  } | null;
  /** A platform reservation holding it, when one does. */
  activeReservation: {
    id: string;
    stage: string;
    user: { firstName: string; lastName: string };
  } | null;
}

export const unitsApi = {
  portfolio: () => apiClient.get<PortfolioUnit[]>('/units/portfolio'),

  /** Manual status override — the developer's escape hatch for off-platform sales. */
  updateStatus: (propertySlug: string, unitId: string, status: UnitStatus) =>
    apiClient.patch<PortfolioUnit>(`/properties/${propertySlug}/units/${unitId}`, { status }),

  /** Units of one property, for pickers. Public endpoint. */
  forProperty: (propertySlug: string) =>
    apiClient.get<PortfolioUnit[]>(`/properties/${propertySlug}/units`),

  /** One unit's full management picture. */
  manage: (unitId: string) => apiClient.get<ManagedUnit>(`/units/${unitId}/manage`),

  addMedia: (unitId: string, body: { type: 'PHOTO' | 'VIDEO'; url: string; title?: string; sizeBytes?: number; mimeType?: string }) =>
    apiClient.post<{ id: string }>(`/units/${unitId}/media`, body),

  removeMedia: (unitId: string, mediaId: string) =>
    apiClient.delete<{ message: string }>(`/units/${unitId}/media/${mediaId}`),
};

/** The manage endpoint's shape — everything a developer needs about one unit. */
export interface ManagedUnit {
  id: string;
  name: string;
  floor: number | null;
  bedrooms: number;
  bathrooms: number;
  sqm: number | null;
  price: number;
  currency: string;
  status: UnitStatus;
  features: string[];
  property: { id: string; slug: string; name: string; heroImageUrl: string | null; city: string; developerId: string };
  ownership: {
    id: string;
    createdAt: string;
    owner: { id: string; firstName: string; lastName: string; email: string; phone: string | null };
    rentListing: {
      id: string; slug: string; name: string; status: string; managerKind: string;
      priceFrom: number | null; currency: string;
      managingAgent: { id: string; displayName: string } | null;
    } | null;
  } | null;
  deals: {
    id: string;
    stage: string;
    clientName: string;
    commissionStatus: string;
    agent: { id: string; displayName: string; photoUrl: string | null; logoUrl: string | null };
  }[];
  reservations: {
    id: string;
    stage: string;
    user: { firstName: string; lastName: string; email: string };
  }[];
  rentUnits: {
    id: string;
    rentListing: {
      id: string; slug: string; name: string; status: string; managerKind: string;
      ownerId: string | null;
      managingAgent: { id: string; displayName: string } | null;
    };
  }[];
  media: { id: string; type: 'PHOTO' | 'VIDEO'; url: string; title: string | null }[];
}
