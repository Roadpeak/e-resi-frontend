import { apiClient } from './client';
import { uploadFile } from './media';

/**
 * Unit ownership and owner lettings — the investor's side of the platform
 * after the keys change hands, and the agent's letting book.
 */

export type LettingStatus = 'PENDING' | 'ACTIVE' | 'DECLINED' | 'ENDED';
export type RentManagerKind = 'OWNER' | 'DEVELOPER' | 'AGENT';

export interface OwnedUnit {
  id: string;
  createdAt: string;
  unit: {
    id: string;
    name: string;
    floor: number | null;
    bedrooms: number;
    bathrooms: number;
    sqm: number | null;
    price: number;
    currency: string;
    status: string;
    property: {
      id: string;
      slug: string;
      name: string;
      heroImageUrl: string | null;
      city: string;
      developerId: string;
    };
  };
  rentListing: {
    id: string;
    slug: string;
    name: string;
    status: string;
    managerKind: RentManagerKind;
    priceFrom: number | null;
    currency: string;
    heroImageUrl: string | null;
    managingAgent: { id: string; displayName: string; photoUrl: string | null; logoUrl: string | null } | null;
    lettingEngagements: {
      id: string;
      status: LettingStatus;
      createdAt: string;
      respondedAt: string | null;
      agent: { id: string; displayName: string; photoUrl: string | null; logoUrl: string | null };
    }[];
  } | null;
}

export interface LettingEngagement {
  id: string;
  status: LettingStatus;
  message: string | null;
  createdAt: string;
  owner: { firstName: string; lastName: string; email: string; phone: string | null };
  rentListing: {
    id: string;
    slug: string;
    name: string;
    status: string;
    heroImageUrl: string | null;
    priceFrom: number | null;
    currency: string;
    city: string;
    neighborhood: string | null;
  };
}

export const ownershipsApi = {
  mine: () => apiClient.get<OwnedUnit[]>('/ownerships/mine'),

  /** Developer: record an off-platform buyer as a unit's owner. */
  record: (unitId: string, ownerEmail: string) =>
    apiClient.post<OwnedUnit>('/ownerships', { unitId, ownerEmail }),

  createListing: (
    ownershipId: string,
    body: {
      name?: string;
      description?: string;
      pricePerMonth: number;
      furnishing?: 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';
      availableFrom?: string;
      minLeaseTerm?: number;
      manage: 'OWNER' | 'DEVELOPER';
    },
  ) => apiClient.post<{ id: string; slug: string }>(`/ownerships/${ownershipId}/listing`, body),

  inviteAgent: (listingId: string, agentId: string, message?: string) =>
    apiClient.post<LettingEngagement>(`/ownerships/listings/${listingId}/invite`, {
      agentId,
      message,
    }),

  agentEngagements: () => apiClient.get<LettingEngagement[]>('/ownerships/engagements/mine'),

  respond: (engagementId: string, accept: boolean) =>
    apiClient.patch<LettingEngagement>(`/ownerships/engagements/${engagementId}/respond`, { accept }),

  end: (engagementId: string) =>
    apiClient.patch<LettingEngagement>(`/ownerships/engagements/${engagementId}/end`, {}),

  /**
   * Upload one interior photo and attach it to the listing. The building's
   * hero came from the property; these are the owner's own unit shots —
   * the photos a tenant actually decides on. The first uploaded photo also
   * becomes the listing's hero, replacing the borrowed building shot.
   */
  addPhoto: async (listingId: string, file: File, makeHero: boolean) => {
    const uploaded = await uploadFile(file, 'rentals');
    await apiClient.post(`/media/rent-listings/${listingId}`, {
      type: 'IMAGE',
      url: uploaded.url,
      sizeBytes: uploaded.sizeBytes,
      mimeType: file.type,
    });
    if (makeHero) {
      await apiClient.patch(`/rent-listings/${listingId}`, { heroImageUrl: uploaded.url });
    }
    return uploaded;
  },
};
