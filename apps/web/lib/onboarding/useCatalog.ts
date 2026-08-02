'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import {
  LISTING_FEE_MONTHLY,
  SERVICES,
  applyCatalogOverrides,
  type ServiceCategory,
  type ServiceDefinition,
} from './catalog';

interface CatalogResponse {
  services: {
    key: string;
    label: string;
    category: 'CAPTURE' | 'IMMERSIVE' | 'MARKETING' | 'DESIGN';
    price: number;
    currency: string;
    unit?: string | null;
    description?: string | null;
    isActive: boolean;
  }[];
  listingFee: { monthly: number; currency: string; freeMonths: number };
  taxRatePercent: number;
}

const CATEGORY_MAP: Record<string, ServiceCategory> = {
  CAPTURE: 'capture',
  IMMERSIVE: 'immersive',
  MARKETING: 'marketing',
  DESIGN: 'design',
};

/**
 * Live pricing from the admin-managed catalogue.
 *
 * The module-level SERVICES / LISTING_FEE_MONTHLY constants remain as the
 * synchronous fallback, so anything rendering before this resolves still shows
 * sensible numbers instead of blanks. On success the constants are patched in
 * place, which lets the six existing consumers pick up admin pricing without
 * each having to become async.
 */
export function useCatalog() {
  const query = useQuery({
    queryKey: ['production-catalog'],
    queryFn: async () => {
      const res = await apiClient.get<CatalogResponse>('/production-tiers/catalog');

      const services: ServiceDefinition[] = res.services
        .filter((s) => s.isActive)
        .map((s) => ({
          id: s.key,
          label: s.label,
          category: CATEGORY_MAP[s.category] ?? 'capture',
          price: s.price,
          unit: s.unit ?? undefined,
          description: s.description ?? '',
        }));

      applyCatalogOverrides(services, res.listingFee.monthly);
      return res;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    services: SERVICES,
    listingFeeMonthly: query.data?.listingFee.monthly ?? LISTING_FEE_MONTHLY,
    currency: query.data?.listingFee.currency ?? 'USD',
    freeMonths: query.data?.listingFee.freeMonths ?? 0,
    taxRatePercent: query.data?.taxRatePercent ?? 0,
    isLoading: query.isLoading,
  };
}
