import { apiClient } from './client';

export interface TrafficRow {
  label: string | null;
  views: number;
  visitors: number;
  country?: string | null;
}

export interface TrafficOverview {
  days: number;
  totals: {
    views: number;
    visitors: number;
    signedInVisitors: number;
    anonymousVisitors: number;
    signedInUsers: number;
    sessions: number;
    bounceRate: number;
    avgTimeOnPageMs: number | null;
    liveNow: number;
  };
  series: { t: string; views: number; visitors: number }[];
  pages: TrafficRow[];
  sources: TrafficRow[];
  countries: TrafficRow[];
  cities: TrafficRow[];
  devices: TrafficRow[];
  os: TrafficRow[];
  browsers: TrafficRow[];
  /** Developments drawing the traffic, across all their addresses. */
  properties?: (TrafficRow & { slug: string })[];
}

export interface TrafficUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export interface SiteVisit {
  id: string;
  visitorId: string;
  sessionId: string;
  userId: string | null;
  user?: TrafficUser | null;
  path: string;
  referrer: string | null;
  referrerHost: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  deviceType: string;
  os: string | null;
  browser: string | null;
  screen: string | null;
  language: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface LiveVisitor {
  visitorId: string;
  path: string;
  createdAt: string;
  country: string | null;
  city: string | null;
  deviceType: string;
  os: string | null;
  browser: string | null;
  user: TrafficUser | null;
}

export interface VisitorTrail {
  visitorId: string;
  user: TrafficUser | null;
  firstSeen: string;
  lastSeen: string;
  sessions: number;
  views: number;
  device: { deviceType: string; os: string | null; browser: string | null; screen: string | null };
  location: { country: string | null; region: string | null; city: string | null; ip: string | null };
  firstReferrer: string | null;
  visits: SiteVisit[];
}

export interface VisitFilters {
  days: number;
  page?: number;
  audience?: 'signed' | 'anonymous' | '';
  deviceType?: string;
  country?: string;
  path?: string;
}

function qs(params: Record<string, unknown>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && v !== null) q.set(k, String(v));
  return q.toString();
}

/** Admin only. */
/** One development's visitors, for its developer. Visitors are never named. */
export interface PropertyTraffic {
  property: { slug: string; name: string; customDomain: string | null; subdomain: string | null };
  days: number;
  totals: {
    views: number; visitors: number;
    signedInViews: number; guestViews: number;
    signedInVisitors: number; guestVisitors: number;
    returningVisitors: number; newVisitors: number;
    sessions: number; bounceRate: number; avgTimeOnPageMs: number | null;
  };
  series: { t: string; views: number; visitors: number }[];
  countries: TrafficRow[];
  cities: (TrafficRow & { country: string | null })[];
  devices: TrafficRow[];
  browsers: TrafficRow[];
  os: TrafficRow[];
  sources: TrafficRow[];
  addresses: TrafficRow[];
  pages: TrafficRow[];
  recent: {
    at: string; page: string; address: string;
    country: string | null; region: string | null; city: string | null;
    deviceType: string | null; os: string | null; browser: string | null;
    source: string | null; durationMs: number | null; signedIn: boolean;
  }[];
}

export const trafficApi = {
  property: (slug: string, days: number) =>
    apiClient.get<PropertyTraffic>(`/traffic/properties/${slug}?days=${days}`),
  overview: (days: number) => apiClient.get<TrafficOverview>(`/admin/traffic/overview?days=${days}`),
  live: () => apiClient.get<{ visitors: number; rows: LiveVisitor[] }>('/admin/traffic/live'),
  visits: (f: VisitFilters) =>
    apiClient.get<{ data: SiteVisit[]; meta: { total: number; page: number; totalPages: number } }>(
      `/admin/traffic/visits?${qs({ ...f, limit: 25 })}`,
    ),
  visitor: (visitorId: string) =>
    apiClient.get<VisitorTrail>(`/admin/traffic/visitors/${encodeURIComponent(visitorId)}`),
};
