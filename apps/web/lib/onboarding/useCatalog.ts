'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { formatMoney } from '../utils';
import {
  LISTING_FEE_MONTHLY,
  SERVICES,
  applyCatalogOverrides,
  type ServiceCategory,
  type ServiceDefinition,
  PLATFORM_FALLBACK_CURRENCY,
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
/**
 * @param propertyType Backend PropertyCategory. Production is priced per type,
 * so the wizard must quote the type's own prices — otherwise it shows default
 * prices and the order then bills the type price.
 */
export function useCatalog(propertyType?: string) {
  const query = useQuery({
    queryKey: ['production-catalog', propertyType ?? 'default'],
    queryFn: async () => {
      const res = await apiClient.get<CatalogResponse>(
        `/production-tiers/catalog${propertyType ? `?propertyType=${propertyType}` : ''}`,
      );

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

      applyCatalogOverrides(services, res.listingFee.monthly, res.listingFee.currency);
      return res;
    },
    staleTime: 5 * 60 * 1000,
  });

  const currency = query.data?.listingFee.currency ?? PLATFORM_FALLBACK_CURRENCY;

  return {
    /** Formats in the platform's actual billing currency. */
    fmt: (n: number) => formatMoney(n, currency),
    services: SERVICES,
    listingFeeMonthly: query.data?.listingFee.monthly ?? LISTING_FEE_MONTHLY,
    // Falls back to the platform default rather than USD: defaulting to a
    // currency the platform does not bill in is how every screen ended up
    // showing dollars after the admin switched to KES.
    currency: query.data?.listingFee.currency ?? PLATFORM_FALLBACK_CURRENCY,
    freeMonths: query.data?.listingFee.freeMonths ?? 0,
    taxRatePercent: query.data?.taxRatePercent ?? 0,
    isLoading: query.isLoading,
  };
}
