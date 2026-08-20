/**
 * Server-side fetch helpers for property pages (SSG/ISR).
 * Used by [slug]/page.tsx and [slug]/tour/* pages.
 */
import type { Property, PropertyTour, TourSection, TourScene } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/** Map the backend developer profile onto the shape the UI expects. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseDeveloper(dev: any) {
  return {
    ...dev,
    name: dev?.name ?? dev?.companyName ?? '',
  };
}

/** The property logo is stored as a media row tagged with a sentinel title. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findLogo(raw: any): string | undefined {
  return (raw.media ?? []).find((m: any) => m?.title === '__logo__')?.url ?? undefined;
}

/** Gallery images may arrive as MediaAsset objects or plain URLs. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseGallery(raw: any): string[] {
  const source = raw.galleryImages ?? raw.media ?? [];
  return source
    .filter((m: any) => typeof m === 'string' || (m?.title !== '__logo__' && m?.url))
    .map((m: any) => (typeof m === 'string' ? m : m.url))
    .filter(Boolean);
}

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
    // Kept as the API sends it (UPPER_SNAKE). It used to be lowercased here,
    // which is why the frontend grew a parallel status vocabulary that no
    // longer matched anything the API would accept.
    status: raw.status,
    // Backend returns MediaAsset objects; the UI expects plain URLs.
    // The logo is stored as a media row with a sentinel title — keep it out of galleries.
    galleryImages: normaliseGallery(raw),
    logoUrl: findLogo(raw),
    // Backend exposes the developer as companyName; the UI reads .name.
    developer: normaliseDeveloper(raw.developer),
    // Scene categories/enums arrive UPPER_SNAKE from Prisma; the UI keys off lower_snake.
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

/** The subset of a property the landing-page showcase renders. */
export interface ShowcaseProperty {
  slug: string;
  name: string;
  location: string;
  tag: string;
  imageUrl: string;
}

/** Title-case an UPPER_SNAKE enum for display ("OFF_PLAN" → "Off Plan"). */
function humaniseEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Featured developments for the landing-page showcase.
 *
 * Returns [] rather than throwing when the API is unreachable — this renders on
 * the landing page, which must not fail to build or serve because the backend
 * is down. The caller drops the section entirely when the list is empty.
 */
export async function fetchFeaturedProperties(limit = 6): Promise<ShowcaseProperty[]> {
  try {
    const res = await fetch(
      `${API_BASE}/properties?limit=${limit}&sortBy=featured`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    // The endpoint is paginated, so the list is one level deeper than `data`.
    const items: any[] = json.data?.data ?? json.data ?? [];

    return items
      // A card is only worth showing if it can link somewhere and show an image.
      .filter((p) => p?.slug && (p.heroImageUrl || p.galleryImages?.[0] || p.media?.[0]?.url))
      .map((p): ShowcaseProperty => {
        const address = p.address ?? {};
        const location = [
          p.neighborhood ?? address.neighborhood,
          p.city ?? address.city,
        ]
          .filter(Boolean)
          .join(', ');

        return {
          slug: p.slug,
          name: p.name ?? 'Untitled development',
          location: location || 'Kenya',
          // Prefer the human tagline; fall back to the category enum.
          tag: p.tagline || (p.category ? humaniseEnum(String(p.category)) : 'Development'),
          imageUrl:
            p.heroImageUrl
            || p.galleryImages?.[0]
            || p.media?.find((m: any) => m?.title !== '__logo__' && m?.url)?.url,
        };
      });
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
      thumbnailUrl: sc.thumbnailUrl ?? sc.imageUrl ?? property.heroImageUrl ?? '',
      cameraPreset: (sc.cameraPreset?.toLowerCase() as TourScene['cameraPreset']) ?? 'interior',
    })),
  }));

  const vrScenes: TourScene[] = (property.tourScenesVR ?? []).map((sc) => ({
    id: sc.id,
    label: sc.label,
    description: sc.description ?? undefined,
    imageUrl: sc.imageUrl ?? '',
    videoUrl: sc.videoUrl ?? undefined,
    thumbnailUrl: sc.thumbnailUrl ?? sc.imageUrl ?? property.heroImageUrl ?? '',
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
