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
  /**
   * Begin card linking on Paystack's hosted checkout. Card details are entered
   * there, never here — which is what keeps this app out of PCI scope.
   */
  paystackStart: () =>
    apiClient.post<{ authorizationUrl: string; reference: string; testMode: boolean }>(
      '/billing/methods/paystack/start',
    ),

  paystackConfirm: (reference: string) =>
    apiClient.post<LinkedMethod>('/billing/methods/paystack/confirm', { reference }),
  paypalStart: () =>
    apiClient.post<{ approvalUrl: string; token: string; sandbox: boolean }>('/billing/methods/paypal/start'),
  paypalConfirm: (token: string) =>
    apiClient.post<LinkedMethod>('/billing/methods/paypal/confirm', { token }),
  payMpesa: (body: { phone: string; amountUsd: number; purpose?: string }) =>
    apiClient.post<{
      paymentId: string; status: string; amountKes: number; amountUsd: number;
      checkoutRequestId: string; sandbox: boolean;
    }>('/billing/pay/mpesa', body),
  setDefault: (id: string) => apiClient.patch<{ message: string }>(`/billing/methods/${id}/default`),
  remove: (id: string) => apiClient.delete<{ message: string }>(`/billing/methods/${id}`),

  /** Invoices and receipts for the signed-in account. */
  invoices: () => apiClient.get<Invoice[]>('/billing/invoices'),
  invoice: (id: string) => apiClient.get<Invoice>(`/billing/invoices/${id}`),

  /** Admin: every invoice, filterable. */
  allInvoices: (params: { status?: string; kind?: string; q?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return apiClient.get<Invoice[]>(`/billing/invoices/all${qs.toString() ? `?${qs}` : ''}`);
  },
  /** Admin: chase an unpaid invoice with a termination warning. */
  remindInvoice: (id: string) => apiClient.post<Invoice>(`/billing/invoices/${id}/remind`),
  /** Admin: force the daily issue/overdue sweep. */
  dispatchInvoices: () =>
    apiClient.post<{ issued: number; markedOverdue: number }>('/billing/invoices/dispatch'),

  /** Admin: what a billing period collected. Period is YYYY-MM. */
  listingFeeReport: (period: string) =>
    apiClient.get<ListingFeeReport>(`/billing/listing-fees/${period}`),

  /** Admin: collect listing fees for a period. Idempotent. */
  runListingFees: (period: string) =>
    apiClient.post<ListingFeeRunSummary>(`/billing/listing-fees/${period}/run`),
};

export interface InvoiceLine {
  description: string;
  quantity?: number;
  unitAmount?: number;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  kind: 'SUBSCRIPTION' | 'PRODUCTION';
  status: 'DRAFT' | 'ISSUED' | 'OVERDUE' | 'PAID' | 'CANCELLED';
  billedToName: string;
  billedToEmail: string;
  lineItems: InvoiceLine[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  currency: string;
  issuedAt?: string | null;
  dueAt: string;
  paidAt?: string | null;
  terminatesAt?: string | null;
  remindersSent: number;
  lastReminderAt?: string | null;
  notes?: string | null;
  createdAt: string;
  receipt?: {
    id: string; number: string; amount: number; currency: string;
    method: string; reference?: string | null; paidAt: string;
  } | null;
  user?: { id: string; email: string } | null;
  property?: { name: string; slug: string } | null;
}

export interface ListingFeeRunSummary {
  period: string;
  developersConsidered: number;
  charged: number;
  failed: number;
  skipped: number;
  alreadyDone: number;
  totalCollected: number;
  currency: string;
}

export interface ListingFeeRun {
  id: string;
  period: string;
  listingCount: number;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'SKIPPED';
  reference?: string | null;
  failureText?: string | null;
  attempts: number;
  chargedAt?: string | null;
  developer: { id: string; companyName: string };
}

export interface ListingFeeReport {
  period: string;
  totals: {
    collected: number; currency: string;
    paid: number; failed: number; pending: number; skipped: number;
  };
  runs: ListingFeeRun[];
}
