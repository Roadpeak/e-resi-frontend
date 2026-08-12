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

export type KybStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AgentDocument {
  type: string;
  url: string;
  label?: string;
}

/**
 * The agent's own record. Carries verification state and submitted documents,
 * which the public projection deliberately omits.
 */
export interface AgentSelf extends Agent {
  userId: string;
  registrationNumber: string | null;
  kybStatus: KybStatus;
  kybDocuments: AgentDocument[] | null;
  kybRejectionReason: string | null;
  isListed: boolean;
  suspendedAt: string | null;
}

/**
 * An agent as an admin sees them: the full record plus the owning user, so a
 * reviewer can check who is behind the application without a second lookup.
 */
export interface AdminAgent extends AgentSelf {
  kybReviewedAt: string | null;
  kybReviewedBy: string | null;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  } | null;
}

/** Document kinds the review queue understands, split by agent kind. */
export const COMPANY_DOCUMENT_TYPES = [
  { value: 'COMPANY_REGISTRATION', label: 'Certificate of incorporation', required: true },
  { value: 'TAX_CERTIFICATE', label: 'Tax compliance certificate' },
  { value: 'ADDRESS_PROOF', label: 'Proof of physical address' },
  { value: 'AGENT_LICENCE', label: 'Estate agent licence' },
  { value: 'OTHER', label: 'Other supporting document' },
] as const;

export const INDIVIDUAL_DOCUMENT_TYPES = [
  { value: 'NATIONAL_ID', label: 'National ID', required: true },
  { value: 'AGENT_LICENCE', label: 'Estate agent licence' },
  { value: 'ADDRESS_PROOF', label: 'Proof of address' },
  { value: 'OTHER', label: 'Other supporting document' },
] as const;

export interface AgentFeeRun {
  id: string;
  /** YYYY-MM. */
  period: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'SKIPPED';
  failureText: string | null;
  chargedAt: string | null;
  /** When an unpaid fee stops being tolerated and the profile is hidden. */
  graceEndsAt: string | null;
}

export interface AgentBilling {
  agent: { kind: AgentKind; isListed: boolean; suspendedAt: string | null } | null;
  runs: AgentFeeRun[];
  nextCharge: {
    amount: number;
    currency: string;
    freeMonths: number;
    inFreeWindow: boolean;
  } | null;
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

  /** Developers actively partnered with this agent — shown on their profile. */
  partners: (id: string) =>
    apiClient.get<{
      id: string;
      developer: { id: string; companyName: string; logoUrl: string | null };
      agent: { id: string; displayName: string };
    }[]>(`/agents/${id}/partners`),

  // ─── Signed-in agent ────────────────────────────────────────────────────

  /** My own profile, including KYC status — not the public projection. */
  me: () => apiClient.get<AgentSelf>('/agents/me'),

  updateMe: (body: Partial<{
    displayName: string;
    bio: string;
    yearsExperience: number;
    website: string;
    logoUrl: string;
    photoUrl: string;
    specialties: AgentSpecialty[];
    serviceAreas: string[];
    phone: string;
    whatsapp: string;
    email: string;
    officeAddress: string;
    location: string;
    socials: AgentSocials;
  }>) => apiClient.patch<AgentSelf>('/agents/me', body),

  /** My listing-fee history and what the next charge will be. */
  billing: () => apiClient.get<AgentBilling>('/billing/agent-fees/mine'),

  submitKyc: (body: {
    documents: { type: string; url: string; label?: string }[];
    registrationNumber?: string;
    officeAddress?: string;
    photoUrl?: string;
  }) => apiClient.post<AgentSelf>('/agents/me/kyc', body),

  // ─── Admin: verification queue ──────────────────────────────────────────
  //
  // These sit behind @Roles(ADMIN). Unlike the public list they return every
  // agent regardless of kybStatus or isListed — the queue exists precisely to
  // see the ones the directory hides.

  adminQueue: (params: {
    kybStatus?: KybStatus | '';
    kind?: AgentKind | '';
    page?: number;
    limit?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.kybStatus) qs.set('kybStatus', params.kybStatus);
    if (params.kind) qs.set('kind', params.kind);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return apiClient.get<Paged<AdminAgent>>(`/agents/admin/queue${qs.toString() ? `?${qs}` : ''}`);
  },

  adminGet: (id: string) => apiClient.get<AdminAgent>(`/agents/admin/${id}`),

  /** Approve or reject. The API requires a reason on rejection. */
  adminReview: (id: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) =>
    apiClient.patch<AdminAgent>(`/agents/admin/${id}/review`, { status, rejectionReason }),

  /** Show or hide in the public directory, independent of verification. */
  adminSetListed: (id: string, isListed: boolean) =>
    apiClient.patch<AdminAgent>(`/agents/admin/${id}/listing`, { isListed }),
};
