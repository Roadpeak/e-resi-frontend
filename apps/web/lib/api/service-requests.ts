import { apiClient, BASE_URL } from './client';
import { useAuthStore } from '../stores/auth.store';

export type ServiceRequestStatus =
  | 'SUBMITTED' | 'QUOTED' | 'CHANGES_REQUESTED' | 'ACCEPTED' | 'PAID'
  | 'IN_PRODUCTION' | 'DELIVERED' | 'DECLINED' | 'CANCELLED';

export type RequesterType = 'DEVELOPER' | 'AGENT' | 'INVESTOR' | 'BUYER' | 'TENANT' | 'OTHER';

export interface ServiceRequestInput {
  requesterType: RequesterType;
  services: string[];
  otherService?: string;
  propertyType?: string;
  location: string;
  address?: string;
  /** yyyy-mm-dd */
  preferredDate?: string;
  timing?: string;
  scope?: string;
  budget?: string;
  details: string;
  contactPhone?: string;
}

export interface QuoteLine { description: string; quantity: number; unitAmount: number; amount: number }

export interface ServiceRequestEvent { id: string; kind: string; message: string; actor: 'CUSTOMER' | 'TEAM'; createdAt: string }

export interface ServiceRequestSummary {
  id: string;
  number: string;
  status: ServiceRequestStatus;
  services: string[];
  otherService: string | null;
  location: string;
  quoteTotal: number | null;
  quoteCurrency: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequest extends ServiceRequestSummary {
  requesterType: RequesterType;
  serviceLabels: string[];
  propertyType: string | null;
  address: string | null;
  preferredDate: string | null;
  timing: string | null;
  scope: string | null;
  budget: string | null;
  details: string;
  contactPhone: string | null;
  quoteNumber: string | null;
  quoteVersion: number;
  quoteLines: QuoteLine[] | null;
  quoteSubtotal: number | null;
  quoteTaxPercent: number | null;
  quoteTaxAmount: number | null;
  quoteNotes: string | null;
  quoteValidUntil: string | null;
  quotedAt: string | null;
  acceptedAt: string | null;
  changeRequest: string | null;
  statusNote: string | null;
  quoteDueBy: string;
  events: ServiceRequestEvent[];
  invoice: {
    id: string; number: string; status: 'DRAFT' | 'ISSUED' | 'OVERDUE' | 'PAID' | 'CANCELLED' | 'WAIVED';
    total: number; currency: string; dueAt: string; paidAt: string | null; receipt: { number: string } | null;
  } | null;
}

export interface CatalogService {
  key: string;
  label: string;
  category: 'CAPTURE' | 'IMMERSIVE' | 'MARKETING' | 'DESIGN';
  description: string | null;
  price?: number;
  currency?: string;
}

export interface AdminServiceRequest extends ServiceRequest {
  user: { id: string; firstName: string; lastName: string; email: string; phone: string | null; role: string };
  catalog: (CatalogService & { price: number; currency: string })[];
  taxRatePercent: number;
  currency: string;
  emailSent?: boolean;
}

export interface AdminListRow extends ServiceRequestSummary {
  requesterType: RequesterType;
  quoteNumber: string | null;
  quoteDueBy: string;
  user: { firstName: string; lastName: string; email: string };
}

/** Fetch a PDF with the signed-in user's token and hand it to the browser as a download. */
async function downloadPdf(path: string, filename: string) {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Could not download the quote');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const serviceRequestsApi = {
  catalog: () =>
    apiClient.get<{ services: CatalogService[] }>('/production-tiers/catalog', { skipAuth: true }),
  create: (input: ServiceRequestInput) => apiClient.post<{ id: string; number: string }>('/service-requests', input),
  mine: () => apiClient.get<ServiceRequestSummary[]>('/service-requests/mine'),
  get: (id: string) => apiClient.get<ServiceRequest>(`/service-requests/${id}`),
  accept: (id: string) => apiClient.post<ServiceRequest>(`/service-requests/${id}/accept`, {}),
  requestChanges: (id: string, message: string) =>
    apiClient.post<ServiceRequest>(`/service-requests/${id}/request-changes`, { message }),
  cancel: (id: string) => apiClient.post<ServiceRequest>(`/service-requests/${id}/cancel`, {}),
  downloadQuote: (r: Pick<ServiceRequest, 'id' | 'quoteNumber' | 'number'>) =>
    downloadPdf(`/service-requests/${r.id}/quote.pdf`, `${r.quoteNumber ?? r.number}.pdf`),

  admin: {
    list: (status?: string, q?: string) => {
      const p = new URLSearchParams();
      if (status) p.set('status', status);
      if (q) p.set('q', q);
      return apiClient.get<{ rows: AdminListRow[]; counts: Partial<Record<ServiceRequestStatus, number>> }>(
        `/admin/service-requests${p.toString() ? `?${p}` : ''}`,
      );
    },
    get: (id: string) => apiClient.get<AdminServiceRequest>(`/admin/service-requests/${id}`),
    sendQuote: (id: string, body: { lines: { description: string; quantity: number; unitAmount: number }[]; validDays?: number; notes?: string }) =>
      apiClient.post<AdminServiceRequest>(`/admin/service-requests/${id}/quote`, body),
    setStatus: (id: string, status: 'IN_PRODUCTION' | 'DELIVERED' | 'DECLINED', note?: string) =>
      apiClient.patch<AdminServiceRequest>(`/admin/service-requests/${id}/status`, { status, note }),
    downloadQuote: (r: Pick<ServiceRequest, 'id' | 'quoteNumber' | 'number'>) =>
      downloadPdf(`/admin/service-requests/${r.id}/quote.pdf`, `${r.quoteNumber ?? r.number}.pdf`),
  },
};

export const STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  SUBMITTED: 'Awaiting quote',
  QUOTED: 'Quote ready',
  CHANGES_REQUESTED: 'Changes requested',
  ACCEPTED: 'Awaiting payment',
  PAID: 'Paid',
  IN_PRODUCTION: 'In production',
  DELIVERED: 'Delivered',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};

export const STATUS_STYLE: Record<ServiceRequestStatus, string> = {
  SUBMITTED: 'bg-[#fef7e0] text-[#b06000]',
  QUOTED: 'bg-[#e8f0fe] text-[#174ea6]',
  CHANGES_REQUESTED: 'bg-[#fef7e0] text-[#b06000]',
  ACCEPTED: 'bg-[#e8f0fe] text-[#174ea6]',
  PAID: 'bg-[#e6f4ea] text-[#137333]',
  IN_PRODUCTION: 'bg-[#f3e8fd] text-[#8430ce]',
  DELIVERED: 'bg-[#e6f4ea] text-[#137333]',
  DECLINED: 'bg-[#fce8e6] text-[#c5221f]',
  CANCELLED: 'bg-[#f1f3f4] text-[#5f6368]',
};

export const REQUESTER_OPTIONS: { value: RequesterType; label: string }[] = [
  { value: 'DEVELOPER', label: 'Developer' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'INVESTOR', label: 'Investor' },
  { value: 'BUYER', label: 'Buyer' },
  { value: 'TENANT', label: 'Tenant' },
  { value: 'OTHER', label: 'Other' },
];

export const money = (n: number, c: string) =>
  `${c} ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
