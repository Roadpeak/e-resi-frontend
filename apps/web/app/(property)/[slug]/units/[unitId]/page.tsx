'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { apiClient } from '../../../../../lib/api/client';
import { formatPrice } from '../../../../../lib/utils';
import { unitCurrency } from '../../../../../lib/units/unit-types';
import { track } from '../../../../../lib/analytics/track';
import type { PublicUnitType, TourScene } from '../../../../../lib/api/unit-types';
import { UnitShowcase, type ShowcaseData } from '../../../../../components/property/unit-showcase/UnitShowcase';

interface Media { id: string; url: string; title?: string | null; type: string; thumbnailUrl?: string | null }

interface UnitDetail {
  id: string;
  name: string;
  floor?: number | null;
  bedrooms: number;
  bathrooms: number;
  sqm?: number | null;
  price: number;
  currency: string;
  status: string;
  features: string[];
  media: Media[];
  unitType: (PublicUnitType & { media: Media[] }) | null;
  siblings: { id: string; name: string; floor?: number | null; price: number; status: string; sqm?: number | null }[];
  floorPlan?: { id: string; name: string; imageUrl: string } | null;
  property: {
    id: string; slug: string; name: string; tagline?: string | null;
    currency?: string | null; city?: string | null; neighborhood?: string | null; heroImageUrl?: string | null;
    hasCinematicTour: boolean; has3DTour: boolean; hasVRTour: boolean;
    completionDate?: string | null; brandColor?: string | null; developerName?: string | null;
    unitFeatures?: string[]; features?: string[];
    listedByAgentId?: string | null;
    developer?: { id?: string | null; companyName?: string | null; logoUrl?: string | null } | null;
    listedByAgent?: { id?: string | null; displayName?: string | null } | null;
    media: Media[];
    cinematicScenes: TourScene[];
    tourSections3D?: { id: string; label: string; scenes: TourScene[] }[];
    tourScenesVR?: TourScene[];
  };
}

const bare = (u: string) => u.split('?')[0];

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="fixed inset-x-0 top-0 z-50 h-16 bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]" />
      {children}
    </div>
  );
}

export default function UnitPage({ params }: { params: Promise<{ slug: string; unitId: string }> }) {
  const { slug, unitId } = use(params);
  const { data: unit, isLoading, isError } = useQuery({
    queryKey: ['unit', slug, unitId],
    queryFn: () => apiClient.get<UnitDetail>(`/properties/${slug}/units/${unitId}`),
  });

  // Which units draw attention tells a developer's sales team what to lead
  // with. Declared before the early returns so hook order stays stable.
  useEffect(() => {
    if (!unit?.property?.id) return;
    track({ type: 'UNIT_VIEWED', propertyId: unit.property.id, metadata: { unitId: unit.id, unitName: unit.name } });
  }, [unit?.property?.id, unit?.id, unit?.name]);

  if (isLoading) {
    return <Shell><div className="flex h-[70vh] items-center justify-center"><Loader2 size={26} className="animate-spin text-gray-400" /></div></Shell>;
  }
  if (isError || !unit) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl px-6 py-40 text-center">
          <p className="text-lg text-gray-600">This unit could not be found.</p>
          <Link href={`/${slug}`} className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-gray-900">
            <ArrowLeft size={15} /> Back to the property
          </Link>
        </div>
      </Shell>
    );
  }

  const p = unit.property;
  const type = unit.unitType;
  const isPhoto = (m: Media) => ['PHOTO', 'DRONE_PHOTO'].includes(m.type) && m.title !== '__logo__';
  // The unit's own photos first, then its layout's, then the building's.
  const images = [
    ...unit.media.filter(isPhoto),
    ...(type?.media ?? []).filter(isPhoto),
    ...(p.heroImageUrl ? [{ id: 'hero', url: p.heroImageUrl, title: p.name, type: 'PHOTO' }] : []),
    ...p.media.filter(isPhoto),
  ].filter((m, i, a) => a.findIndex((o) => bare(o.url) === bare(m.url)) === i);
  const videos = [...unit.media, ...(type?.media ?? [])]
    .filter((m) => m.type === 'VIDEO')
    .map((m) => ({ url: m.url, title: m.title, poster: m.thumbnailUrl }));
  const logoUrl = p.media.find((m) => m.title === '__logo__')?.url ?? p.developer?.logoUrl;
  const currency = unitCurrency(unit, p.currency);
  const status = unit.status.toLowerCase();

  const data: ShowcaseData = {
    kind: 'unit',
    title: unit.name,
    eyebrow: type?.name ?? (unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bedroom`),
    status: status === 'available'
      ? { label: 'Available', tone: 'green' }
      : status === 'reserved' ? { label: 'Reserved', tone: 'amber' } : { label: 'Sold', tone: 'grey' },
    priceLabel: unit.price ? formatPrice(unit.price, currency) : null,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    sqm: unit.sqm ?? type?.sqm,
    sqft: type?.sqft,
    floor: unit.floor,
    description: type?.description,
    features: [...new Set([...(unit.features ?? []), ...(type?.features ?? [])])],
    images,
    videos,
    floorPlan: type?.floorPlanUrl
      ? { url: type.floorPlanUrl, name: type.name }
      : unit.floorPlan ? { url: unit.floorPlan.imageUrl, name: unit.floorPlan.name } : null,
    cinematic: type ? p.cinematicScenes.filter((s) => type.cinematicSceneIds.includes(s.id)) : [],
    sections3D: type ? (p.tourSections3D ?? []).filter((s) => type.tourSection3DIds.includes(s.id)) : [],
    vr: type ? (p.tourScenesVR ?? []).filter((s) => type.vrSceneIds.includes(s.id)) : [],
    rows: unit.siblings.map((s) => ({ ...s, href: `/${p.slug}/units/${s.id}` })),
    rowsTitle: type ? `Other ${type.name} units` : 'Similar units in this development',
    currency,
    property: {
      slug: p.slug, name: p.name, tagline: p.tagline, city: p.city, neighborhood: p.neighborhood,
      brandColor: p.brandColor, logoUrl,
      ownerName: p.developer?.companyName ?? p.listedByAgent?.displayName ?? p.developerName,
      ownerHref: p.developer?.id ? `/developers/${p.developer.id}` : p.listedByAgent?.id ? `/agents/${p.listedByAgent.id}` : null,
      completionDate: p.completionDate,
      hasCinematicTour: p.hasCinematicTour, has3DTour: p.has3DTour, hasVRTour: p.hasVRTour,
      unitFeatures: p.unitFeatures ?? [], features: p.features ?? [],
      agentListed: !!p.listedByAgentId,
    },
  };

  return <UnitShowcase data={data} />;
}
