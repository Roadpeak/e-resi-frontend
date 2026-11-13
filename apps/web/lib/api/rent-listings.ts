import { apiClient } from './client';
import { uploadFile } from './media';
import type { RentListing } from '../types';

// Shape returned by the backend list endpoint
export interface BackendRentListingItem {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  status: string;
  furnishing: string;
  neighborhood?: string | null;
  city: string;
  county?: string | null;
  country: string;
  heroImageUrl?: string | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  currency: string;
  availableFrom?: string | null;
  minLeaseTerm: number;
  show3DTour: boolean;
  showCinematicTour: boolean;
  featuredCinematicSceneIds: string[];
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
  description?: string | null;
  /** Standalone listings carry their own kind; in-development ones use the property's. */
  category?: string | null;
  /** Only the area is public; the exact spot is shared on enquiry. */
  hideExactLocation?: boolean;
  features?: string[];
  latitude?: number | null;
  longitude?: number | null;
  /** Present on the single-listing endpoint — the development this belongs to. Null for a standalone rental. */
  property?: { id: string; slug: string; name: string; heroImageUrl?: string | null } | null;
  media?: Array<{ id?: string; url: string; title?: string | null; type?: string }>;
  managerKind?: string;
  managingAgent?: { phone?: string | null; whatsapp?: string | null } | null;
  developer?: { companyName?: string; phone?: string | null; whatsapp?: string | null } | null;
  rentUnits: Array<{
    id?: string;
    label: string;
    bedrooms: number;
    bathrooms?: number;
    sqm?: number | null;
    pricePerMonth: number;
    currency?: string;
    available: number;
    total: number;
    furnishing?: string;
    floor?: number | null;
    unitType?: string | null;
    showCinematicTour?: boolean;
    show3DTour?: boolean;
    showVRTour?: boolean;
    features?: string[];
  }>;
}

export interface BackendRentListingsResponse {
  data: BackendRentListingItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/** Transform backend shape → frontend RentListing type */
/** Prisma enums arrive UPPER_SNAKE; the UI compares against lower_snake. */
function lower(v?: string | null): string | undefined {
  return v ? v.toLowerCase() : undefined;
}

export function toRentListing(b: BackendRentListingItem): RentListing {
  // Whoever runs the letting answers the phone: the managing agent, else the developer.
  const runner = b.managerKind === 'AGENT' && b.managingAgent ? b.managingAgent : b.developer;
  return {
    contact: { phone: runner?.phone ?? null, whatsapp: runner?.whatsapp ?? null },
    id: b.id,
    slug: b.slug,
    propertyId: b.property?.id ?? '',
    propertySlug: b.property?.slug ?? '',
    name: b.name,
    tagline: b.tagline ?? '',
    description: b.description ?? '',
    address: {
      neighborhood: b.neighborhood ?? b.city,
      city: b.city,
      county: b.county ?? '',
      country: b.country,
      coordinates: { lat: 0, lng: 0 },
    },
    heroImageUrl: b.heroImageUrl ?? '',
    galleryImages: (b.media ?? [])
      .filter((m) => m?.title !== '__logo__' && m?.url)
      .map((m) => m.url),
    units: b.rentUnits.map((u, i) => ({
      id: u.id ?? String(i),
      label: u.label,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms ?? 1,
      floor: u.floor ?? undefined,
      unitType: u.unitType ?? undefined,
      showCinematicTour: !!u.showCinematicTour,
      show3DTour: !!u.show3DTour,
      showVRTour: !!u.showVRTour,
      sqm: u.sqm ?? 0,
      pricePerMonth: u.pricePerMonth,
      currency: u.currency ?? b.currency,
      available: u.available,
      total: u.total,
      furnishing: lower(u.furnishing ?? b.furnishing) as RentListing['furnishing'],
      features: u.features ?? [],
    })),
    amenities: [],
    status: lower(b.status) as RentListing['status'],
    furnishing: lower(b.furnishing) as RentListing['furnishing'],
    priceFrom: b.priceFrom ?? 0,
    priceTo: b.priceTo ?? 0,
    currency: b.currency,
    availableFrom: b.availableFrom ?? b.createdAt,
    minLeaseTerm: b.minLeaseTerm,
    show3DTour: b.show3DTour,
    showCinematicTour: b.showCinematicTour,
    featuredCinematicSceneIds: b.featuredCinematicSceneIds,
    developer: { id: '', name: '', logoUrl: '', description: '', establishedYear: 0, completedProjects: 0 },
    tags: b.tags,
    isFeatured: b.isFeatured,
    createdAt: b.createdAt,
    updatedAt: b.createdAt,
  };
}

export const rentListingsApi = {
  list: (params: { page?: number; limit?: number; city?: string; q?: string; category?: string; area?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.city) qs.set('city', params.city);
    if (params.q) qs.set('q', params.q);
    if (params.category) qs.set('category', params.category);
    if (params.area) qs.set('area', params.area);
    const q = qs.toString();
    return apiClient.get<BackendRentListingsResponse>(`/rent-listings${q ? `?${q}` : ''}`);
  },

  get: (slug: string) =>
    apiClient.get<BackendRentListingItem>(`/rent-listings/${slug}`),

  listMine: (params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return apiClient.get<BackendRentListingsResponse>(`/rent-listings/my/listings${q ? `?${q}` : ''}`);
  },

  // ─── Developer: editing ─────────────────────────────────────────────────
  //
  // The API has had these since the module was built; the client never
  // exposed them, which is why the dashboard's Edit button did nothing.
  // Note these take the listing **id**, not the slug — the read endpoints
  // take a slug, so mixing them up 404s.

  update: (
    id: string,
    body: Partial<{
      name: string;
      tagline: string;
      description: string;
      furnishing: string;
      neighborhood: string;
      city: string;
      priceFrom: number;
      priceTo: number;
      currency: string;
      heroImageUrl: string;
      availableFrom: string;
      minLeaseTerm: number;
      tags: string[];
      category: string;
      hideExactLocation: boolean;
      features: string[];
      latitude: number;
      longitude: number;
      county: string;
    }>,
  ) => apiClient.patch<BackendRentListingItem>(`/rent-listings/${id}`, body),

  /** Upload one photo and attach it; optionally make it the cover. */
  addPhoto: async (listingId: string, file: File, makeHero: boolean, order = 0) => {
    const uploaded = await uploadFile(file, 'rentals');
    await apiClient.post(`/media/rent-listings/${listingId}`, {
      type: 'PHOTO', url: uploaded.url, order, isFeatured: makeHero,
      sizeBytes: uploaded.sizeBytes, mimeType: file.type,
    });
    if (makeHero) await apiClient.patch(`/rent-listings/${listingId}`, { heroImageUrl: uploaded.url });
    return uploaded;
  },

  removePhoto: (mediaId: string) => apiClient.delete<unknown>(`/media/${mediaId}`),

  setStatus: (id: string, status: string) =>
    apiClient.patch<BackendRentListingItem>(`/rent-listings/${id}/status`, { status }),

  removeUnit: (listingId: string, unitId: string) =>
    apiClient.delete<unknown>(`/rent-listings/${listingId}/units/${unitId}`),

  /** Visits, contact taps and leads for one rental (its manager only). */
  stats: (id: string, days = 30) => apiClient.get<RentalStats>(`/rent-listings/${id}/stats?days=${days}`),
};

export interface RentalStats {
  days: number;
  totals: {
    views: number; visitors: number; signedInVisitors: number; whatsapp: number; calls: number;
    enquiries: number; viewings: number; reservations: number;
  };
  daily: { date: string; views: number; leads: number }[];
  sources: { source: string; count: number }[];
  leads: {
    id: string; kind: 'ENQUIRY' | 'VIEWING'; name: string; email?: string | null; phone?: string | null;
    note?: string | null; status: string; createdAt: string;
  }[];
}
