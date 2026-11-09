import { apiClient } from './client';

/** How many of a layout are left — counted by hand, or from linked units. */
export interface TypeCounts {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  source: 'manual' | 'units';
}

export interface TypeMedia {
  id: string;
  url: string;
  type: string;
  title?: string | null;
  thumbnailUrl?: string | null;
}

/** A unit type as the public sees it. */
export interface PublicUnitType {
  id: string;
  name: string;
  description?: string | null;
  bedrooms: number;
  bathrooms: number;
  sqm?: number | null;
  sqft?: number | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  features: string[];
  floorPlanUrl?: string | null;
  coverImageUrl?: string | null;
  cinematicSceneIds: string[];
  tourSection3DIds: string[];
  vrSceneIds: string[];
  media: TypeMedia[];
  counts: TypeCounts;
}

/** The owner's view: hand-kept numbers, linked units, all media. */
export interface ManagedUnitType extends PublicUnitType {
  availableCount: number;
  reservedCount: number;
  soldCount: number;
  order: number;
  units: { id: string; name: string; status: string; floor?: number | null }[];
}

export interface TourScene { id: string; label: string; sublabel?: string | null; videoUrl?: string | null; imageUrl?: string | null; thumbnailUrl?: string | null; description?: string | null }

export interface UnitTypeDetail extends PublicUnitType {
  units: { id: string; name: string; floor?: number | null; price: number; status: string; sqm?: number | null }[];
  property: {
    id: string; slug: string; name: string; tagline?: string | null;
    city?: string | null; neighborhood?: string | null; county?: string | null;
    heroImageUrl?: string | null; currency?: string | null; completionDate?: string | null; category?: string | null;
    hasCinematicTour: boolean; has3DTour: boolean; hasVRTour: boolean;
    unitFeatures: string[]; features: string[]; brandColor?: string | null;
    developer?: { companyName?: string | null; logoUrl?: string | null } | null;
    listedByAgent?: { displayName?: string | null; logoUrl?: string | null; photoUrl?: string | null } | null;
    developerName?: string | null;
    media: { id: string; url: string; title?: string | null; type: string }[];
    cinematicScenes: TourScene[];
    tourSections3D: { id: string; label: string; scenes: TourScene[] }[];
    tourScenesVR: TourScene[];
  };
  otherTypes: {
    id: string; name: string; bedrooms: number; sqm?: number | null; sqft?: number | null;
    priceFrom?: number | null; priceTo?: number | null; coverImageUrl?: string | null; counts: TypeCounts;
  }[];
}

export type UnitTypeInput = Partial<Omit<ManagedUnitType, 'id' | 'media' | 'counts' | 'units'>> & {
  name?: string;
  unitIds?: string[];
};

export type InventoryState = 'available' | 'reserved' | 'sold';

export const unitTypesApi = {
  list: (slug: string) => apiClient.get<PublicUnitType[]>(`/properties/${slug}/unit-types`),
  get: (slug: string, id: string) => apiClient.get<UnitTypeDetail>(`/properties/${slug}/unit-types/${id}`),
  manage: (slug: string) => apiClient.get<ManagedUnitType[]>(`/properties/${slug}/unit-types/manage`),
  create: (slug: string, body: UnitTypeInput) => apiClient.post<ManagedUnitType>(`/properties/${slug}/unit-types`, body),
  update: (slug: string, id: string, body: UnitTypeInput) =>
    apiClient.patch<ManagedUnitType>(`/properties/${slug}/unit-types/${id}`, body),
  move: (slug: string, id: string, from: InventoryState, to: InventoryState, count = 1) =>
    apiClient.post<ManagedUnitType>(`/properties/${slug}/unit-types/${id}/move`, { from, to, count }),
  remove: (slug: string, id: string) => apiClient.delete<unknown>(`/properties/${slug}/unit-types/${id}`),
  addMedia: (slug: string, id: string, body: { type: 'PHOTO' | 'VIDEO'; url: string; sizeBytes?: number; mimeType?: string; title?: string }) =>
    apiClient.post<TypeMedia>(`/properties/${slug}/unit-types/${id}/media`, body),
  removeMedia: (slug: string, id: string, mediaId: string) =>
    apiClient.delete<unknown>(`/properties/${slug}/unit-types/${id}/media/${mediaId}`),
};

/** "5 of 20 left" — the line every type card leads with. */
export function leftLabel(c: TypeCounts): string {
  if (c.total === 0) return 'Availability on request';
  if (c.available === 0) return 'Sold out';
  return `${c.available} of ${c.total} left`;
}

/** "200 sqft" / "145 m²" — whichever the developer gave, both when both. */
export function typeSize(t: { sqm?: number | null; sqft?: number | null }): string | null {
  const parts = [t.sqm ? `${t.sqm} m²` : null, t.sqft ? `${t.sqft.toLocaleString()} sqft` : null].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}
