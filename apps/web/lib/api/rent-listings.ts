import { apiClient } from './client';
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
  /** Present on the single-listing endpoint — the development this belongs to. */
  property?: { id: string; slug: string; name: string; heroImageUrl?: string | null } | null;
  media?: Array<{ url: string; title?: string | null }>;
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
  return {
    id: b.id,
    slug: b.slug,
    propertyId: b.property?.id ?? '',
    propertySlug: b.property?.slug ?? '',
    name: b.name,
    tagline: b.tagline ?? '',
    description: '',
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
  list: (params: { page?: number; limit?: number; city?: string; q?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.city) qs.set('city', params.city);
    if (params.q) qs.set('q', params.q);
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
};
