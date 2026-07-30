/**
 * Server-side fetch helpers for property pages (SSG/ISR).
 * Used by [slug]/page.tsx and [slug]/tour/* pages.
 */
import type { Property, PropertyTour, TourSection, TourScene } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/** Normalise flat backend fields into the nested shape the frontend expects. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseProperty(raw: any): Property {
  return {
    ...raw,
    address: raw.address ?? {
      neighborhood: raw.neighborhood ?? '',
      city: raw.city ?? '',
      county: raw.county ?? '',
      country: raw.country ?? 'Kenya',
      coordinates: { lat: raw.latitude ?? 0, lng: raw.longitude ?? 0 },
    },
    availableUnits: raw.availableUnits ?? raw._count?.units ?? 0,
    currency: raw.currency ?? 'KES',
    status: raw.status?.toLowerCase() ?? raw.status,
    galleryImages: raw.galleryImages ?? raw.media ?? [],
    floorPlans: raw.floorPlans ?? [],
    units: raw.units ?? [],
    amenities: raw.amenities ?? [],
    constructionUpdates: raw.constructionUpdates ?? [],
  };
}

export async function fetchProperty(slug: string): Promise<Property | null> {
  try {
    const res = await fetch(`${API_BASE}/properties/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json.data ?? json;
    return normaliseProperty(raw);
  } catch {
    return null;
  }
}

/** Build slugs for generateStaticParams from the live API (falls back to empty array at build time). */
export async function fetchPropertySlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/properties?limit=100`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const items: Array<{ slug: string }> = json.data?.data ?? json.data ?? [];
    return items.map((p) => p.slug);
  } catch {
    return [];
  }
}

/**
 * Convert the backend property's embedded tour data into the
 * PropertyTour shape expected by Tour3DClient / TourVRClient.
 */
export function buildTour(property: Property & {
  tourSections3D?: Array<{
    id: string; label: string; order?: number;
    scenes: Array<{
      id: string; label: string; description?: string | null;
      imageUrl?: string | null; videoUrl?: string | null;
      thumbnailUrl?: string | null; cameraPreset?: string | null;
    }>;
  }>;
  tourScenesVR?: Array<{
    id: string; label: string; description?: string | null;
    imageUrl?: string | null; videoUrl?: string | null;
    thumbnailUrl?: string | null; cameraPreset?: string | null;
  }>;
}): PropertyTour {
  const sections3D: TourSection[] = (property.tourSections3D ?? []).map((s) => ({
    id: s.id,
    type: 'property_views' as const,
    label: s.label,
    icon: '🏠',
    scenes: s.scenes.map((sc): TourScene => ({
      id: sc.id,
      label: sc.label,
      description: sc.description ?? undefined,
      imageUrl: sc.imageUrl ?? '',
      videoUrl: sc.videoUrl ?? undefined,
      thumbnailUrl: sc.thumbnailUrl ?? sc.imageUrl ?? '',
      cameraPreset: (sc.cameraPreset?.toLowerCase() as TourScene['cameraPreset']) ?? 'interior',
    })),
  }));

  const vrScenes: TourScene[] = (property.tourScenesVR ?? []).map((sc) => ({
    id: sc.id,
    label: sc.label,
    description: sc.description ?? undefined,
    imageUrl: sc.imageUrl ?? '',
    videoUrl: sc.videoUrl ?? undefined,
    thumbnailUrl: sc.thumbnailUrl ?? sc.imageUrl ?? '',
    cameraPreset: (sc.cameraPreset?.toLowerCase() as TourScene['cameraPreset']) ?? 'interior',
  }));

  // VR scenes are wrapped in a single section
  const sectionsVR: TourSection[] = vrScenes.length > 0
    ? [{ id: 'vr-main', type: 'property_views' as const, label: 'VR Experience', icon: '🥽', scenes: vrScenes }]
    : [];

  const allSections = sections3D.length > 0 ? sections3D : sectionsVR;

  return {
    propertyId: property.id,
    has3D: property.has3DTour,
    hasVR: property.hasVRTour,
    sections: allSections.length > 0 ? allSections : [{
      id: 'placeholder',
      type: 'property_views' as const,
      label: 'Tour',
      icon: '🏠',
      scenes: [],
    }],
  };
}
