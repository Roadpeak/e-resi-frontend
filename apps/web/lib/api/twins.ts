import { apiClient } from './client';
import { useAuthStore } from '../stores/auth.store';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/**
 * Digital twins — the building geometry behind a 3D tour.
 *
 * The mesh deliberately does not use the presigned direct-to-Cloudinary path
 * the rest of our media takes. The API parses the glTF container before it
 * accepts it, and a file that went straight to storage would skip that check —
 * a corrupt or mislabelled model would then only reveal itself as an empty
 * viewer on a buyer's phone.
 */

export interface TwinWaypoint {
  id: string;
  label: string;
  caption?: string | null;
  route?: string | null;
  posX: number; posY: number; posZ: number;
  lookX: number; lookY: number; lookZ: number;
  floor: number;
  order: number;
  /**
   * A 360° image rendered from this waypoint by the API's bake step, when one
   * exists. Absent on a twin uploaded before panoramas, or one whose bake was
   * skipped — the viewer falls back to the live model in both cases.
   */
  panoramaUrl?: string | null;
  panoramaAt?: string | null;
}

export interface TwinTag {
  id: string;
  title: string;
  body?: string | null;
  posX: number; posY: number; posZ: number;
  floor: number;
}

export type TwinKind = 'BUILDING' | 'UNIT' | 'AMENITY' | 'ROOM';

export interface DigitalTwin {
  id: string;
  /** What this model is of — shown on the switcher tile. */
  label: string;
  kind: TwinKind;
  /** A still for the switcher tile. */
  posterUrl?: string | null;
  isPrimary: boolean;
  order: number;
  meshUrl: string;
  proxyUrl?: string | null;
  scale: number;
  scaleVerified: boolean;
  triangles?: number | null;
  fileSizeBytes?: number | null;
  originX: number; originY: number; originZ: number;
  floors: string[];
  capturedAt?: string | null;
  waypoints: TwinWaypoint[];
  tags: TwinTag[];
}

export interface GlbSummary {
  triangles: number;
  meshes: number;
  materials: number;
  textures: number;
  compression: 'draco' | 'meshopt' | 'none';
  ktx2: boolean;
  bytes: number;
}

export interface MeshUploadResult {
  twin: DigitalTwin;
  summary: GlbSummary;
  /** Budget breaches — the model still uploaded. */
  warnings: string[];
}

export const twinsApi = {
  /** Every model for a property, the one to open on first. */
  list: (slug: string) => apiClient.get<DigitalTwin[]>(`/properties/${slug}/twin`),

  update: (twinId: string, slug: string, body: Partial<{
    label: string;
    kind: TwinKind;
    posterUrl: string;
    isPrimary: boolean;
    order: number;
    scale: number;
    scaleVerified: boolean;
    floors: string[];
    originX: number; originY: number; originZ: number;
    capturedAt: string;
  }>) => apiClient.patch<DigitalTwin>(`/properties/${slug}/twin/${twinId}`, body),

  remove: (twinId: string, slug: string) =>
    apiClient.delete<{ message: string }>(`/properties/${slug}/twin/${twinId}`),

  addWaypoint: (twinId: string, slug: string, body: {
    label: string; caption?: string; route?: string;
    posX: number; posY: number; posZ: number;
    lookX?: number; lookY?: number; lookZ?: number;
    floor?: number; order?: number;
  }) => apiClient.post<TwinWaypoint>(`/properties/${slug}/twin/${twinId}/waypoints`, body),

  /**
   * Edit a stop in place.
   *
   * Partial: send only what changed. Moving a stop clears its baked panorama
   * server-side, because the image was rendered from the old position; re-aiming
   * does not, because where the camera looks is a viewer-side heading rather
   * than something baked into the sphere.
   */
  updateWaypoint: (slug: string, id: string, body: {
    label?: string; caption?: string; route?: string;
    posX?: number; posY?: number; posZ?: number;
    lookX?: number; lookY?: number; lookZ?: number;
    floor?: number; order?: number;
  }) => apiClient.patch<TwinWaypoint>(`/properties/${slug}/twin/waypoints/${id}`, body),

  /** Save a new order for every stop on the model, in one transaction. */
  reorderWaypoints: (twinId: string, slug: string, ids: string[]) =>
    apiClient.patch<{ message: string }>(
      `/properties/${slug}/twin/${twinId}/waypoints/order`,
      { ids },
    ),

  /** Render a 360° image from every stop. Slow — about 25s per stop. */
  bakePanoramas: (twinId: string, slug: string, opts: { stale?: boolean } = {}) =>
    apiClient.post<{ baked: number; total: number; message: string }>(
      `/properties/${slug}/twin/${twinId}/panoramas${opts.stale ? '?stale=true' : ''}`,
      {},
    ),

  removeWaypoint: (slug: string, id: string) =>
    apiClient.delete<{ message: string }>(`/properties/${slug}/twin/waypoints/${id}`),

  addTag: (twinId: string, slug: string, body: {
    title: string; body?: string;
    posX: number; posY: number; posZ: number; floor?: number;
  }) => apiClient.post<TwinTag>(`/properties/${slug}/twin/${twinId}/tags`, body),

  removeTag: (slug: string, id: string) =>
    apiClient.delete<{ message: string }>(`/properties/${slug}/twin/tags/${id}`),
};

/**
 * Upload a .glb, reporting progress.
 *
 * XHR rather than fetch: a model is tens of megabytes and the upload can take a
 * while on a Kenyan connection, and fetch still cannot report request progress.
 */
export function uploadMesh(
  slug: string,
  file: File,
  options: {
    kind?: 'mesh' | 'proxy';
    /** Replaces this model rather than adding another. */
    twinId?: string;
    label?: string;
    twinKind?: TwinKind;
    onProgress?: (percent: number) => void;
    signal?: AbortSignal;
  } = {},
): Promise<MeshUploadResult> {
  const { kind = 'mesh', twinId, label, twinKind, onProgress, signal } = options;
  const token = useAuthStore.getState().accessToken;

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    const q = new URLSearchParams({ kind });
    if (twinId) q.set('twinId', twinId);
    if (label) q.set('label', label);
    if (twinKind) q.set('twinKind', twinKind);
    xhr.open('POST', `${BASE_URL}/properties/${slug}/twin/mesh?${q}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let parsed: unknown = null;
      try { parsed = JSON.parse(xhr.responseText); } catch { /* handled below */ }

      const body = parsed as { data?: MeshUploadResult; error?: string; message?: string } | null;

      if (xhr.status >= 200 && xhr.status < 300 && body?.data) {
        resolve(body.data);
        return;
      }
      // The API's own message says what to export instead, so it is passed
      // through rather than replaced with a status code.
      reject(new Error(body?.error || body?.message || `Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error('Upload failed — check your connection.'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(form);
  });
}
