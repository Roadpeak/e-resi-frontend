'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Eye, Globe, Film, Box, Home, Loader2, MapPin } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { cn } from '../../../../lib/utils';
import { useMyRentListings } from '../../../../lib/api/queries';
import { rentListingsApi } from '../../../../lib/api/rent-listings';
import { ApiError } from '../../../../lib/api/client';

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-[#e6f4ea] text-[#188038]',
  PARTIALLY_AVAILABLE: 'bg-[#fef7e0] text-[#b06000]',
  FULLY_LET: 'bg-[#f1f3f4] text-[#5f6368]',
  ARCHIVED: 'bg-[#f1f3f4] text-[#80868b]',
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  PARTIALLY_AVAILABLE: 'Partially Available',
  FULLY_LET: 'Fully Let',
  ARCHIVED: 'Archived',
};

function formatRent(price: number) {
  if (price >= 1_000_000) return `KES ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `KES ${(price / 1_000).toFixed(0)}K`;
  return `KES ${price.toLocaleString()}`;
}

export default function DashboardRentals() {
  const base = usePathname().startsWith('/agent') ? '/agent' : '/dashboard';
  // Always stacked cards: they read well on any screen. (A table view used to
  // be remembered per browser, which left phones stuck on it with no switch.)
  const [actionError, setActionError] = useState('');
  const queryClient = useQueryClient();

  // Archiving takes the listing off the public site without deleting it —
  // the menu item previously did nothing at all.
  const archive = useMutation({
    mutationFn: (id: string) => rentListingsApi.setStatus(id, 'ARCHIVED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rent-listings', 'mine'] });
      setActionError('');
    },
    onError: (e) =>
      setActionError(e instanceof ApiError ? e.message : 'Could not archive that listing'),
  });
  const { data, isLoading } = useMyRentListings({ limit: 50 });
  const listings = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-[#1a73e8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Rent listings</h2>
          <p className="text-base text-[#5f6368] mt-0.5">{listings.length} active listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`${base}/rentals/new`}>
            <Button icon={<Plus size={15} />} className="rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-[15px] font-medium shadow-none">
              New Listing
            </Button>
          </Link>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dadce0] bg-white p-16 text-center">
          <Home size={32} className="mx-auto mb-3 text-[#dadce0]" />
          <p className="text-base font-medium text-[#202124]">No rent listings yet</p>
          <p className="text-base text-[#5f6368] mt-1">Create a rent listing and connect it to your property with available unit types.</p>
          <Link href={`${base}/rentals/new`}>
            <Button className="mt-5 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-[15px] font-medium shadow-none" icon={<Plus size={14} />}>
              New Listing
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Table */}
          {actionError && (
          <p className="mb-4 rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">
            {actionError}
          </p>
        )}

          <ul className="space-y-3">
            {listings.map((listing, i) => {
              const totalAvailable = listing.units.reduce((s, u) => s + u.available, 0);
              const totalUnits = listing.units.reduce((s, u) => s + u.total, 0);
              const statusKey = listing.status.toUpperCase().replace(/ /g, '_');
              return (
                <motion.li key={listing.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-3xl border border-[#dadce0] bg-white p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <Link href={`${base}/rentals/${listing.slug}`} className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#f1f3f4] sm:h-28 sm:w-40">
                      {listing.heroImageUrl ? (
                        <Image src={listing.heroImageUrl} alt={listing.name} fill className="object-cover" sizes="160px" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[#dadce0]"><Home size={22} /></span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`${base}/rentals/${listing.slug}`} className="block truncate text-[16px] font-medium text-[#202124] hover:text-[#1a73e8]">{listing.name}</Link>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-[#5f6368]">
                            <MapPin size={12} className="shrink-0" /> {[listing.address.neighborhood, listing.address.city].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium', STATUS_STYLES[statusKey] ?? STATUS_STYLES.AVAILABLE)}>
                          {STATUS_LABELS[statusKey] ?? listing.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-[#3c4043]">
                        <span><span className="font-medium text-[#202124]">{formatRent(listing.priceFrom)}</span> <span className="text-[#80868b]">/mo</span></span>
                        <span><span className="font-medium text-[#202124]">{totalAvailable}</span> <span className="text-[#80868b]">of {totalUnits} available</span></span>
                        {listing.stats && (
                          <span className="inline-flex items-center gap-1 text-[#5f6368]"><Eye size={12} /> {listing.stats.views30d} visits · {listing.stats.leads} lead{listing.stats.leads === 1 ? '' : 's'}</span>
                        )}
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {listing.showCinematicTour && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fef7e0] px-2.5 py-0.5 text-xs font-medium text-[#b06000]"><Film size={10} /> Cinematic</span>
                        )}
                        {listing.show3DTour && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-medium text-[#1967d2]"><Box size={10} /> 3D</span>
                        )}
                        <span className="ml-auto flex items-center gap-1">
                          <Link href={`${base}/rentals/${listing.slug}`} title="Open and edit" aria-label={`Open and edit ${listing.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4] hover:text-[#202124]">
                            <Eye size={14} />
                          </Link>
                          <a href={`/rent/${listing.slug}`} target="_blank" rel="noreferrer noopener" title="View live page" aria-label={`View ${listing.name} live`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4] hover:text-[#202124]">
                            <Globe size={14} />
                          </a>
                          <button type="button" onClick={() => archive.mutate(listing.id)} disabled={archive.isPending} title="Archive"
                            className="flex h-8 items-center rounded-full px-2.5 text-[12.5px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6] disabled:opacity-40">
                            Archive
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
          {/* Add more CTA */}
          <div className="rounded-3xl border border-dashed border-[#dadce0] bg-white p-10 text-center">
            <Home size={32} className="mx-auto mb-3 text-[#dadce0]" />
            <p className="text-base font-medium text-[#202124]">Ready to add another listing?</p>
            <Link href={`${base}/rentals/new`}>
              <Button className="mt-5 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-[15px] font-medium shadow-none" icon={<Plus size={14} />}>
                New Listing
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
