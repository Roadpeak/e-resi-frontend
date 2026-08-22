'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../../../components/dashboard/MaterialIcon';
import { PropertyMediaManager } from '../../../../../../components/dashboard/PropertyMediaManager';
import { DigitalTwinManager } from '../../../../../../components/admin/DigitalTwinManager';
import { apiClient } from '../../../../../../lib/api/client';

interface PropertyDetail {
  slug: string;
  name: string;
  status: string;
  heroImageUrl?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  developer?: { companyName?: string | null } | null;
}

/**
 * Admin media studio — the same uploader developers use, on any property.
 * The media and tour endpoints already exempt ADMIN from the ownership check,
 * so this needs no special-casing.
 */
export default function AdminPropertyMedia({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  /**
   * The 3D tour is built, not just uploaded to — a stop needs a camera
   * position and an order, which the general media uploader has no place to
   * ask for. Separating them keeps each screen answering one question.
   */
  const [tab, setTab] = useState<'media' | 'twin'>('media');

  const { data: property, isLoading } = useQuery({
    queryKey: ['admin-property', slug],
    queryFn: () => apiClient.get<PropertyDetail>(`/properties/${slug}`),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <MaterialIcon name="progress_activity" size={30} className="animate-spin text-[#80868b]" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center">
        <MaterialIcon name="error" size={28} className="text-[#80868b]" />
        <p className="mt-2 text-[15px] text-[#5f6368]">That property could not be loaded.</p>
        <Link href="/admin/properties" className="mt-3 inline-block text-[14px] text-[#1a73e8]">
          Back to properties
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/properties"
        className="inline-flex items-center gap-1.5 text-[14px] text-[#5f6368] transition-colors hover:text-[#202124]"
      >
        <MaterialIcon name="arrow_back" size={16} /> All properties
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">{property.name}</h1>
          <p className="text-[14px] text-[#5f6368]">
            {property.developer?.companyName ?? 'Unknown developer'}
            {property.city && ` · ${[property.neighborhood, property.city].filter(Boolean).join(', ')}`}
          </p>
        </div>
        <Link
          href={`/${property.slug}`}
          className="rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff]"
        >
          View public page
        </Link>
      </div>

      {/* Editing another developer's content should never feel incidental. */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-[#f9ab00] bg-[#fffbf0] px-4 py-3">
        <MaterialIcon name="admin_panel_settings" size={18} className="mt-0.5 text-[#b06000]" />
        <p className="text-[13px] text-[#5f6368]">
          You are editing media on behalf of{' '}
          <span className="font-medium text-[#202124]">
            {property.developer?.companyName ?? 'this developer'}
          </span>
          . Uploads appear on their public listing immediately.
        </p>
      </div>

      <div className="flex gap-1 rounded-full border border-[#dadce0] bg-white p-1">
        {([
          { key: 'media' as const, label: 'Media' },
          { key: 'twin' as const, label: '3D tour' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={
              tab === t.key
                ? 'cursor-pointer rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white'
                : 'cursor-pointer rounded-full px-4 py-2 text-[14px] font-medium text-[#5f6368] transition-colors hover:bg-[#f1f3f4]'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'media' ? (
        <PropertyMediaManager slug={property.slug} heroImageUrl={property.heroImageUrl} />
      ) : (
        <DigitalTwinManager slug={property.slug} />
      )}
    </div>
  );
}
