/**
 * TanStack Query hooks for e-resi data
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { propertiesApi, type PropertiesQuery } from './properties';
import { authApi } from './auth';
import { inquiriesApi } from './inquiries';
import { bookingsListApi } from './bookings-api';
import { analyticsApi } from './analytics';
import { savedApi } from './saved';
import { reservationsApi } from './reservations';
import { rentListingsApi, toRentListing } from './rent-listings';
import { useAuthStore } from '../stores/auth.store';

// ── Properties ─────────────────────────────────────────────────

/**
 * Normalise a raw backend property into the frontend Property shape.
 * The backend returns flat address fields (neighborhood, city, county, latitude, longitude)
 * while the frontend type expects a nested address object.
 */
function toProperty(raw: any) {
  return {
    ...raw,
    // Build nested address from flat backend fields
    address: raw.address ?? {
      neighborhood: raw.neighborhood ?? '',
      city: raw.city ?? '',
      county: raw.county ?? '',
      country: raw.country ?? 'Kenya',
      coordinates: {
        lat: raw.latitude ?? 0,
        lng: raw.longitude ?? 0,
      },
    },
    // Backend doesn't compute availableUnits — default to 0 until units are loaded
    availableUnits: raw.availableUnits ?? raw._count?.units ?? 0,
    currency: raw.currency ?? 'KES',
    // Normalise status to lowercase for frontend enums
    status: raw.status?.toLowerCase() ?? raw.status,
    // Ensure arrays are always defined
    galleryImages: (raw.galleryImages ?? raw.media ?? [])
      .filter((m: any) => typeof m === 'string' || (m?.title !== '__logo__' && m?.url))
      .map((m: any) => (typeof m === 'string' ? m : m.url))
      .filter(Boolean),
    logoUrl: (raw.media ?? []).find((m: any) => m?.title === '__logo__')?.url ?? undefined,
    developer: { ...raw.developer, name: raw.developer?.name ?? raw.developer?.companyName ?? '' },
    cinematicScenes: (raw.cinematicScenes ?? []).map((s: any) => ({
      ...s,
      category: String(s.category ?? 'full_tour').toLowerCase(),
    })),
    floorPlans: raw.floorPlans ?? [],
    units: raw.units ?? [],
    amenities: raw.amenities ?? [],
    constructionUpdates: raw.constructionUpdates ?? [],
  };
}

export function useProperties(query: PropertiesQuery = {}) {
  return useQuery({
    queryKey: ['properties', query],
    queryFn: async () => {
      const res = await propertiesApi.list(query);
      return { items: (res.data ?? []).map(toProperty), total: res.meta?.total ?? 0 };
    },
  });
}

export function useMyProperties(query: PropertiesQuery = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['my-properties', query],
    queryFn: async () => {
      const res = await propertiesApi.myListings(query);
      return { items: (res.data ?? []).map(toProperty), total: res.meta?.total ?? 0 };
    },
    enabled: isAuthenticated && (user?.role === 'DEVELOPER' || user?.role === 'ADMIN'),
  });
}

export function useDeveloperEngagement(days = 7) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['analytics', 'developer-engagement', days],
    queryFn: () => analyticsApi.developerEngagement(days),
    enabled: isAuthenticated && (user?.role === 'DEVELOPER' || user?.role === 'ADMIN'),
  });
}

export function useUnreadNotificationCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiClient.get<{ count: number }>('/notifications/unread-count'),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });
}

export function useProperty(slug: string) {
  return useQuery({
    queryKey: ['property', slug],
    queryFn: async () => toProperty(await propertiesApi.get(slug)),
    enabled: !!slug,
  });
}

// ── Auth ───────────────────────────────────────────────────────

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
    enabled: isAuthenticated,
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      qc.clear();
    },
  });
}

// ── Analytics ──────────────────────────────────────────────────

export function useDeveloperStats() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['analytics', 'developer-stats'],
    queryFn: () => analyticsApi.developerStats(),
    enabled: isAuthenticated && (user?.role === 'DEVELOPER' || user?.role === 'ADMIN'),
  });
}

// ── Inquiries ──────────────────────────────────────────────────

export function useDeveloperInquiries(params: { page?: number; limit?: number; status?: string } = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['inquiries', 'developer', params],
    queryFn: async () => {
      const res = await inquiriesApi.listForDeveloper(params);
      return { items: res.data, total: res.meta.total };
    },
    enabled: isAuthenticated && (user?.role === 'DEVELOPER' || user?.role === 'ADMIN'),
  });
}

export function useMyInquiries(params: { page?: number; limit?: number } = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['inquiries', 'mine', params],
    queryFn: async () => {
      const res = await inquiriesApi.listMine(params);
      return { items: res.data, total: res.meta.total };
    },
    enabled: isAuthenticated,
  });
}

export function useReplyInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => inquiriesApi.reply(id, reply),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
}

// ── Bookings ───────────────────────────────────────────────────

export function useDeveloperBookings(params: { page?: number; limit?: number; status?: string } = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['bookings', 'developer', params],
    queryFn: async () => {
      const res = await bookingsListApi.listForDeveloper(params);
      return { items: res.data, total: res.meta.total };
    },
    enabled: isAuthenticated && (user?.role === 'DEVELOPER' || user?.role === 'ADMIN'),
  });
}

export function useMyBookings(params: { page?: number; limit?: number } = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['bookings', 'mine', params],
    queryFn: async () => {
      const res = await bookingsListApi.listMine(params);
      return { items: res.data, total: res.meta.total };
    },
    enabled: isAuthenticated,
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, meetingUrl }: { id: string; status: string; meetingUrl?: string }) =>
      bookingsListApi.updateStatus(id, status, meetingUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

// ── Saved Properties ───────────────────────────────────────────

export function useSavedProperties() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['saved-properties'],
    queryFn: async () => {
      const res = await savedApi.list();
      return res.data; // unwrap inner data array
    },
    enabled: isAuthenticated,
  });
}

export function useSaveProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => savedApi.save(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-properties'] });
    },
  });
}

export function useRemoveSavedProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => savedApi.remove(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-properties'] });
    },
  });
}

// ── Reservations ───────────────────────────────────────────────

export function useMyReservations(params: { page?: number; limit?: number } = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['reservations', 'mine', params],
    queryFn: async () => {
      const res = await reservationsApi.listMine(params);
      return { items: res.data, total: res.meta.total };
    },
    enabled: isAuthenticated,
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationsApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

// ── Rent Listings ──────────────────────────────────────────────

export function useRentListings(params: { page?: number; limit?: number; city?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ['rent-listings', params],
    queryFn: async () => {
      const res = await rentListingsApi.list(params);
      return { items: res.data.map(toRentListing), total: res.meta.total };
    },
  });
}

export function useMyRentListings(params: { page?: number; limit?: number } = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['rent-listings', 'mine', params],
    queryFn: async () => {
      const res = await rentListingsApi.listMine(params);
      return { items: res.data.map(toRentListing), total: res.meta.total };
    },
    enabled: isAuthenticated && (user?.role === 'DEVELOPER' || user?.role === 'ADMIN'),
  });
}
