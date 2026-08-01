import { apiClient } from './client';

export interface LinkedMethod {
  id: string;
  type: 'CARD' | 'PAYPAL';
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  paypalEmail?: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface BillingSummary {
  feePerListing: number;
  currency: string;
  monthly: { liveCount: number; total: number };
  listings: { id: string; name: string; slug: string; status: string; monthlyFee: number }[];
  production: {
    pendingTotal: number;
    orders: { propertyId: string; name: string; serviceIds: string[]; total: number }[];
  };
  payments: {
    id: string; amount: number; currency: string; method: string;
    status: string; reference?: string | null; createdAt: string;
  }[];
}

export const billingApi = {
  summary: () => apiClient.get<BillingSummary>('/billing/summary'),
  listMethods: () => apiClient.get<LinkedMethod[]>('/billing/methods'),
  linkCard: (card: { brand: string; last4: string; expMonth: number; expYear: number; makeDefault?: boolean }) =>
    apiClient.post<LinkedMethod>('/billing/methods', { type: 'CARD', ...card }),
  linkPaypal: (paypalEmail: string, makeDefault?: boolean) =>
    apiClient.post<LinkedMethod>('/billing/methods', { type: 'PAYPAL', paypalEmail, makeDefault }),
  setDefault: (id: string) => apiClient.patch<{ message: string }>(`/billing/methods/${id}/default`),
  remove: (id: string) => apiClient.delete<{ message: string }>(`/billing/methods/${id}`),
};

/** Detect card brand from the number's leading digits — the number itself never leaves the browser. */
export function detectBrand(cardNumber: string): string {
  const n = cardNumber.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^6/.test(n)) return 'Discover';
  return 'Card';
}
