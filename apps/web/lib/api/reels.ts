import { apiClient } from './client';

export interface ReelLink {
  deal: 'SALE' | 'RENT';
  slug: string;
  name: string;
  priceFrom: number | null;
  currency: string;
  href: string;
}

export interface Reel {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  durationSec: number | null;
  city: string | null;
  neighborhood: string | null;
  status: 'PUBLISHED' | 'HIDDEN' | 'REMOVED';
  removedReason: string | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  likedByMe: boolean;
  link: ReelLink | null;
  owner: { kind: 'AGENT' | 'DEVELOPER'; id: string; name: string; imageUrl: string | null; href: string } | null;
}

export interface ReelComment {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string; avatarUrl: string | null };
  byOwner: boolean;
  mine: boolean;
  replies?: ReelComment[];
}

export interface ReelsState {
  unlocked: boolean;
  price: number;
  currency: string;
  invoice: { id: string; number: string; total: number; currency: string; status: string } | null;
}

export interface LinkableListing {
  deal: 'SALE' | 'RENT';
  id: string;
  slug: string;
  name: string;
  city: string | null;
  neighborhood: string | null;
  heroImageUrl: string | null;
}

/** Anonymous id kept in this browser so signed-out feeds still learn what someone likes. */
export function reelVisitorId(): string {
  try {
    let v = localStorage.getItem('eresi-reel-vid');
    if (!v) {
      v = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('eresi-reel-vid', v);
    }
    return v;
  } catch {
    return '';
  }
}

export type FeedParams = { deal?: 'SALE' | 'RENT'; agentId?: string; developerId?: string; start?: string; offset?: number; limit?: number };

export const reelsApi = {
  feed: (p: FeedParams = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== '') qs.set(k, String(v));
    const vid = typeof window !== 'undefined' ? reelVisitorId() : '';
    if (vid) qs.set('visitorId', vid);
    return apiClient.get<{ items: Reel[]; nextOffset: number | null }>(`/reels?${qs.toString()}`);
  },
  one: (id: string) => apiClient.get<Reel>(`/reels/${id}`),
  view: (id: string, watchedMs: number) =>
    apiClient.post<{ ok: true }>(`/reels/${id}/view`, { visitorId: reelVisitorId() || undefined, watchedMs: Math.round(watchedMs) }),
  like: (id: string, on: boolean) =>
    on ? apiClient.post<{ liked: boolean; likeCount: number }>(`/reels/${id}/like`) : apiClient.delete<{ liked: boolean; likeCount: number }>(`/reels/${id}/like`),
  comments: (id: string) => apiClient.get<{ canReply: boolean; items: ReelComment[] }>(`/reels/${id}/comments`),
  comment: (id: string, body: string, parentId?: string) => apiClient.post<{ id: string }>(`/reels/${id}/comments`, { body, parentId }),
  deleteComment: (commentId: string) => apiClient.delete<{ ok: true }>(`/reels/comments/${commentId}`),

  // Owner
  state: () => apiClient.get<ReelsState>('/reels/me/state'),
  unlock: () => apiClient.post<ReelsState>('/reels/me/unlock'),
  linkable: () => apiClient.get<LinkableListing[]>('/reels/me/linkable'),
  mine: () => apiClient.get<Reel[]>('/reels/me'),
  create: (body: { videoUrl: string; caption?: string; durationSec?: number; propertyId?: string; rentListingId?: string; city?: string; neighborhood?: string }) =>
    apiClient.post<{ id: string }>('/reels', body),
  update: (id: string, body: { caption?: string; propertyId?: string; rentListingId?: string; status?: 'PUBLISHED' | 'HIDDEN' }) =>
    apiClient.patch<unknown>(`/reels/${id}`, body),
  remove: (id: string) => apiClient.delete<{ ok: true }>(`/reels/${id}`),

  // Admin
  adminList: (p: { status?: string; q?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(p)) if (v) qs.set(k, String(v));
    return apiClient.get<{ items: Reel[]; total: number; page: number; totalPages: number; counts: Record<string, number>; price: number; currency: string }>(`/admin/reels?${qs.toString()}`);
  },
  adminComments: (id: string) => apiClient.get<{ canReply: boolean; items: ReelComment[] }>(`/admin/reels/${id}/comments`),
  adminSetStatus: (id: string, status: 'PUBLISHED' | 'REMOVED', reason?: string) => apiClient.patch<unknown>(`/admin/reels/${id}`, { status, reason }),
  adminDeleteComment: (commentId: string) => apiClient.delete<{ ok: true }>(`/admin/reels/comments/${commentId}`),
};

export function compactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

/** A poster frame for a Cloudinary video when the reel has no thumbnail. */
export function reelPoster(r: Pick<Reel, 'thumbnailUrl' | 'videoUrl'>): string | null {
  if (r.thumbnailUrl) return r.thumbnailUrl;
  if (r.videoUrl.includes('res.cloudinary.com') && r.videoUrl.includes('/video/upload/')) {
    return r.videoUrl.replace('/video/upload/', '/video/upload/so_1,w_540,c_fill,ar_9:16/').replace(/\.[a-z0-9]+(\?.*)?$/i, '.jpg');
  }
  return null;
}
