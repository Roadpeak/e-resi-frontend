import { apiClient } from './client';

export interface DeveloperSocials {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
}

/** One row in the public /developers directory. */
export interface DeveloperCard {
  id: string;
  companyName: string;
  logoUrl: string | null;
  location: string | null;
  phone: string | null;
  whatsapp: string | null;
  establishedYear: number | null;
  completedProjects: number;
  _count: { properties: number };
}

/** A property as embedded in a developer's public profile. */
export interface DeveloperPropertyPreview {
  id: string;
  slug: string;
  name: string;
  heroImageUrl: string | null;
  city: string;
  neighborhood: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  currency: string;
  latitude: number | null;
  longitude: number | null;
  category: string;
}

export interface DeveloperProfileDetail {
  id: string;
  companyName: string;
  logoUrl: string | null;
  description: string | null;
  establishedYear: number | null;
  completedProjects: number;
  website: string | null;
  location: string | null;
  phone: string | null;
  whatsapp: string | null;
  socials: DeveloperSocials | null;
  properties: DeveloperPropertyPreview[];
}

interface Paged<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

export const developersApi = {
  /** Public directory — KYB-approved developers with at least one live listing. */
  list: (params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return apiClient.get<Paged<DeveloperCard>>(`/users/developers${qs.toString() ? `?${qs}` : ''}`);
  },
  /** Public profile by developer profile id, with their active properties. */
  get: (profileId: string) =>
    apiClient.get<DeveloperProfileDetail>(`/users/developers/id/${profileId}`),
};
