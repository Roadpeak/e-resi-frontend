import { apiClient } from './client';

/** Mirrors the backend AgentKind enum. */
export type AgentKind = 'COMPANY' | 'INDIVIDUAL';

/** Mirrors the backend AgentSpecialty enum. */
export type AgentSpecialty =
  | 'APARTMENT_RENTAL'
  | 'APARTMENT_PURCHASE'
  | 'VILLA_RENTAL'
  | 'VILLA_PURCHASE'
  | 'COMMERCIAL_RENTAL'
  | 'COMMERCIAL_PURCHASE'
  | 'LAND_SALE';

/** Labels for the enum values, used everywhere agents are shown or filtered. */
export const SPECIALTY_LABELS: Record<AgentSpecialty, string> = {
  APARTMENT_RENTAL: 'Apartment rentals',
  APARTMENT_PURCHASE: 'Apartment purchase',
  VILLA_RENTAL: 'Villa rentals',
  VILLA_PURCHASE: 'Villa purchase',
  COMMERCIAL_RENTAL: 'Commercial rentals',
  COMMERCIAL_PURCHASE: 'Commercial purchase',
  LAND_SALE: 'Land sales',
};

export const ALL_SPECIALTIES = Object.keys(SPECIALTY_LABELS) as AgentSpecialty[];

export interface AgentSocials {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
}

/**
 * The public shape of an agent. The API returns the same fields for the
 * directory and the profile page, so one type covers both — KYC documents are
 * never part of it.
 */
export interface Agent {
  id: string;
  kind: AgentKind;
  displayName: string;
  logoUrl: string | null;
  photoUrl: string | null;
  bio: string | null;
  yearsExperience: number | null;
  website: string | null;
  specialties: AgentSpecialty[];
  serviceAreas: string[];
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  officeAddress: string | null;
  location: string | null;
  socials: AgentSocials | null;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
}

export interface AgentReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  /** First name only — a review is public, the reviewer's full identity is not. */
  author: { firstName: string; avatarUrl: string | null };
}

interface Paged<T> {
  data: T[];
  meta: {
    total: number; page: number; limit: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
}

export const agentsApi = {
  /**
   * Verified, currently-listed agents, best-rated first. `specialty` is what
   * the "Need agent help?" picker filters on, `kind` splits its two tabs.
   */
  list: (params: {
    page?: number;
    limit?: number;
    kind?: AgentKind;
    specialty?: AgentSpecialty;
    q?: string;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.kind) qs.set('kind', params.kind);
    if (params.specialty) qs.set('specialty', params.specialty);
    if (params.q) qs.set('q', params.q);
    return apiClient.get<Paged<Agent>>(`/agents${qs.toString() ? `?${qs}` : ''}`);
  },

  /** One agent's public profile. 404s for unverified or delisted agents. */
  get: (id: string) => apiClient.get<Agent>(`/agents/${id}`),

  reviews: (id: string, params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return apiClient.get<Paged<AgentReview>>(
      `/agents/${id}/reviews${qs.toString() ? `?${qs}` : ''}`,
    );
  },

  /**
   * Whether the signed-in user may review, and why not if they may not — the
   * UI explains the requirement rather than silently hiding the form.
   */
  reviewEligibility: (id: string) =>
    apiClient.get<{ allowed: boolean; reason?: string }>(`/agents/${id}/reviews/eligibility`),

  submitReview: (id: string, rating: number, comment?: string) =>
    apiClient.post<{ id: string; ratingAverage: number; ratingCount: number }>(
      `/agents/${id}/reviews`,
      { rating, comment },
    ),

  deleteOwnReview: (id: string) => apiClient.delete<unknown>(`/agents/${id}/reviews/mine`),
};
