import { apiClient } from './client';

/** One ordered production service on a development. */
export interface ProductionOrderRow {
  id: string;
  serviceKey: string;
  label: string;
  amount: number;
  currency: string;
  status: 'ORDERED' | 'SCHEDULED' | 'IN_PRODUCTION' | 'DELIVERED' | 'CANCELLED';
  preferredDate?: string | null;
  instructions?: string | null;
  accessInfo?: string | null;
  scheduledAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

export interface OrderServiceInput {
  serviceKey: string;
  preferredDate?: string;
  instructions?: string;
  accessInfo?: string;
}

export const productionApi = {
  /** Orders already placed against one development. */
  forProperty: (slug: string) =>
    apiClient.get<ProductionOrderRow[]>(`/production-tiers/properties/${slug}/services`),

  /**
   * Order more services on a development that already exists. Priced from the
   * catalog at the moment of ordering, not when the property was created.
   */
  order: (slug: string, services: OrderServiceInput[]) =>
    apiClient.post<ProductionOrderRow[]>(
      `/production-tiers/properties/${slug}/services`,
      { services },
    ),
};
