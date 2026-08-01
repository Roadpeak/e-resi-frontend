import { apiClient } from './client';

export interface LinkedMethod {
  id: string;
  type: 'CARD' | 'PAYPAL' | 'MPESA';
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  cardholderName?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  country?: string | null;
  paypalEmail?: string | null;
  paypalAgreementId?: string | null;
  mpesaPhone?: string | null;
  verification: 'PENDING' | 'VERIFIED' | 'FAILED';
  isDefault: boolean;
  createdAt: string;
  sandbox?: boolean;
}

export interface CardDetails {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  cardholderName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
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
    status: string; reference?: string | null;
    metadata?: { purpose?: string; reversed?: boolean } | null;
    createdAt: string;
  }[];
}

export const billingApi = {
  summary: () => apiClient.get<BillingSummary>('/billing/summary'),
  listMethods: () => apiClient.get<LinkedMethod[]>('/billing/methods'),
  /** Full card details go to the API for the $1 verification only — never persisted. */
  linkCard: (card: CardDetails) => apiClient.post<LinkedMethod>('/billing/methods/card', card),
  paypalStart: () =>
    apiClient.post<{ approvalUrl: string; token: string; sandbox: boolean }>('/billing/methods/paypal/start'),
  paypalConfirm: (token: string) =>
    apiClient.post<LinkedMethod>('/billing/methods/paypal/confirm', { token }),
  linkMpesa: (phone: string) => apiClient.post<LinkedMethod>('/billing/methods/mpesa', { phone }),
  setDefault: (id: string) => apiClient.patch<{ message: string }>(`/billing/methods/${id}/default`),
  remove: (id: string) => apiClient.delete<{ message: string }>(`/billing/methods/${id}`),
};

/** Detect card brand from the number's leading digits (client-side, for the live badge). */
export function detectBrand(cardNumber: string): string {
  const n = cardNumber.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^6/.test(n)) return 'Discover';
  return '';
}

export function formatCardNumber(v: string): string {
  return v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
}
