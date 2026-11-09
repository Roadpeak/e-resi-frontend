'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatPrice } from '../../../../../lib/utils';
import { track } from '../../../../../lib/analytics/track';
import { unitTypesApi } from '../../../../../lib/api/unit-types';
import { UnitShowcase, type ShowcaseData } from '../../../../../components/property/unit-showcase/UnitShowcase';

const bare = (u: string) => u.split('?')[0];

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="fixed inset-x-0 top-0 z-50 h-16 bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]" />
      {children}
    </div>
  );
}

/**
 * A unit type's own page: the layout described once, with its photos, video,
 * the tours chosen for it, how many are left, and — when the developer linked
 * them — the individual units of that layout.
 */
export default function UnitTypePage({ params }: { params: Promise<{ slug: string; typeId: string }> }) {
  const { slug, typeId } = use(params);
  const { data: t, isLoading, isError } = useQuery({
    queryKey: ['unit-type', slug, typeId],
    queryFn: () => unitTypesApi.get(slug, typeId),
  });

  useEffect(() => {
    if (!t?.property?.id) return;
    track({ type: 'UNIT_VIEWED', propertyId: t.property.id, metadata: { unitTypeId: t.id, unitName: t.name } });
  }, [t?.property?.id, t?.id, t?.name]);

  if (isLoading) {
    return <Shell><div className="flex h-[70vh] items-center justify-center"><Loader2 size={26} className="animate-spin text-gray-400" /></div></Shell>;
  }
  if (isError || !t) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl px-6 py-40 text-center">
          <p className="text-lg text-gray-600">This layout could not be found.</p>
          <Link href={`/${slug}`} className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-gray-900">
            <ArrowLeft size={15} /> Back to the property
          </Link>
        </div>
      </Shell>
    );
  }

  const p = t.property;
  const currency = p.currency || 'KES';
  const isPhoto = (m: { type: string; title?: string | null }) => ['PHOTO', 'DRONE_PHOTO'].includes(m.type) && m.title !== '__logo__';
  const cover = t.coverImageUrl ? [{ url: t.coverImageUrl, title: t.name }] : [];
  const images = [
    ...cover,
    ...t.media.filter(isPhoto),
    // A layout with few photos of its own borrows the building's.
    ...(t.media.filter(isPhoto).length < 5 ? [
      ...(p.heroImageUrl ? [{ url: p.heroImageUrl, title: p.name }] : []),
      ...p.media.filter(isPhoto),
    ] : []),
  ].filter((m, i, a) => a.findIndex((o) => bare(o.url) === bare(m.url)) === i);

  const price = t.priceFrom
    ? t.priceTo && t.priceTo !== t.priceFrom
      ? `${formatPrice(t.priceFrom, currency)} – ${formatPrice(t.priceTo, currency)}`
      : formatPrice(t.priceFrom, currency)
    : null;

  const data: ShowcaseData = {
    kind: 'type',
    title: t.name,
    eyebrow: 'Unit type',
    status: t.counts.total > 0 && t.counts.available === 0 ? { label: 'Sold out', tone: 'grey' } : undefined,
    counts: t.counts,
    priceLabel: price,
    priceNote: t.priceTo && t.priceTo !== t.priceFrom ? 'Price range' : 'Price',
    bedrooms: t.bedrooms,
    bathrooms: t.bathrooms,
    sqm: t.sqm,
    sqft: t.sqft,
    description: t.description,
    features: t.features,
    images,
    videos: t.media.filter((m) => m.type === 'VIDEO').map((m) => ({ url: m.url, title: m.title, poster: m.thumbnailUrl })),
    floorPlan: t.floorPlanUrl ? { url: t.floorPlanUrl, name: t.name } : null,
    cinematic: p.cinematicScenes,
    sections3D: p.tourSections3D,
    vr: p.tourScenesVR,
    rows: t.units.map((u) => ({ ...u, href: `/${p.slug}/units/${u.id}` })),
    rowsTitle: `Units of this layout (${t.units.length})`,
    otherTypes: t.otherTypes,
    currency,
    property: {
      slug: p.slug, name: p.name, tagline: p.tagline, city: p.city, neighborhood: p.neighborhood,
      brandColor: p.brandColor,
      logoUrl: p.media.find((m) => m.title === '__logo__')?.url ?? p.developer?.logoUrl,
      ownerName: p.developer?.companyName ?? p.listedByAgent?.displayName ?? p.developerName,
      ownerHref: p.developer?.id ? `/developers/${p.developer.id}` : p.listedByAgent?.id ? `/agents/${p.listedByAgent.id}` : null,
      completionDate: p.completionDate,
      hasCinematicTour: p.hasCinematicTour, has3DTour: p.has3DTour, hasVRTour: p.hasVRTour,
      unitFeatures: p.unitFeatures ?? [], features: p.features ?? [],
      agentListed: !p.developer && !!p.listedByAgent,
    },
  };

  return <UnitShowcase data={data} />;
}
