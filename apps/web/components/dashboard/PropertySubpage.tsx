'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/api/client';
import { cn } from '../../lib/utils';
import { PropertyActionsMenu } from './PropertyActionsMenu';
import { PROPERTY_SECTIONS, isPublicStatus, sectionHref } from './propertySections';

/** The fields every section page needs; each page reads what it uses. */
export interface SubpageProperty {
  id: string;
  slug: string;
  name: string;
  status: string;
  currency: string;
  heroImageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  customDomain?: string | null;
  subdomain?: string | null;
  amenities?: { id?: string; name: string; type: string; distance?: string | null }[];
  units: { id: string; name: string; bedrooms: number; price: number; status: string }[];
}

/** Tabs across every page of one development. Scrolls sideways on a phone. */
export function PropertySectionNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Development sections">
      <div className="flex min-w-max gap-1 border-b border-[#e8eaed]">
        {PROPERTY_SECTIONS.map((s) => {
          const href = sectionHref(slug, s);
          const active = pathname === href;
          return (
            <Link
              key={s.key}
              href={href}
              className={cn(
                '-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[14px] font-medium transition-colors',
                active
                  ? 'border-[#1a73e8] text-[#1a73e8]'
                  : 'border-transparent text-[#5f6368] hover:text-[#202124]',
              )}
            >
              <s.icon size={15} /> {s.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Shell for a development's section pages: back link, title, the same
 * actions menu as everywhere else, and the section tabs.
 */
export function PropertySubpage({
  slug,
  title,
  description,
  children,
}: {
  slug: string;
  title: string;
  description?: string;
  children: (property: SubpageProperty) => ReactNode;
}) {
  const [error, setError] = useState('');
  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['dash-property', slug],
    queryFn: () => apiClient.get<SubpageProperty>(`/properties/${slug}`),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#80868b]" />
      </div>
    );
  }
  if (isError || !property) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-base text-[#5f6368]">This development could not be loaded. Archived developments must be restored first.</p>
        <Link href={`/dashboard/properties/${slug}`} className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-[#1a73e8]">
          <ArrowLeft size={15} /> Back to the development
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href={`/dashboard/properties/${slug}`}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1a73e8] hover:text-[#1765cc]"
        >
          <ArrowLeft size={14} /> {property.name}
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[26px] font-normal text-[#202124] sm:text-[28px]">{title}</h2>
            {description && <p className="mt-0.5 text-base text-[#5f6368]">{description}</p>}
          </div>
          <div className="flex gap-2">
            {isPublicStatus(property.status) && (
              <a
                href={`/${property.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff]"
              >
                <ExternalLink size={15} /> View live
              </a>
            )}
            <PropertyActionsMenu property={property} variant="button" onError={setError} />
          </div>
        </div>
      </div>
      <PropertySectionNav slug={slug} />
      {error && <p className="rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}
      {children(property)}
    </div>
  );
}
