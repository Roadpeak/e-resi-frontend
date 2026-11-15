import { apiClient } from './client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/** The homepage 3D showcase: outside and inside .glb models, set by an admin. */
export interface Home3D {
  exterior: string | null;
  interior: string | null;
  caption: string | null;
  link: string | null;
}

export const EMPTY_HOME_3D: Home3D = { exterior: null, interior: null, caption: null, link: null };

/** Server-side read for the homepage, cached five minutes. Never throws. */
export async function fetchHome3D(): Promise<Home3D> {
  try {
    const res = await fetch(`${API_BASE}/site/home-3d`, { next: { revalidate: 300 } });
    if (!res.ok) return EMPTY_HOME_3D;
    const json = await res.json();
    return { ...EMPTY_HOME_3D, ...(json.data ?? {}) };
  } catch {
    return EMPTY_HOME_3D;
  }
}

export const siteApi = {
  home3d: () => apiClient.get<Home3D>('/site/home-3d', { skipAuth: true }),
};
