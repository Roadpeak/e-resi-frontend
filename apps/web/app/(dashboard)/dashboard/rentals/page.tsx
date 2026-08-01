'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Eye, Pencil, Film, Box, Home, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { cn } from '../../../../lib/utils';
import { useMyRentListings } from '../../../../lib/api/queries';

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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
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
        <Link href="/dashboard/rentals/new">
          <Button icon={<Plus size={15} />} className="rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-[15px] font-medium shadow-none">
            New Listing
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dadce0] bg-white p-16 text-center">
          <Home size={32} className="mx-auto mb-3 text-[#dadce0]" />
          <p className="text-base font-medium text-[#202124]">No rent listings yet</p>
          <p className="text-base text-[#5f6368] mt-1">Create a rent listing and connect it to your property with available unit types.</p>
          <Link href="/dashboard/rentals/new">
            <Button className="mt-5 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-[15px] font-medium shadow-none" icon={<Plus size={14} />}>
              New Listing
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#dadce0]">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Listing</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Units</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Price From</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Tours</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {listings.map((listing, i) => {
                    const totalAvailable = listing.units.reduce((s, u) => s + u.available, 0);
                    const totalUnits = listing.units.reduce((s, u) => s + u.total, 0);
                    const statusKey = listing.status.toUpperCase().replace(/ /g, '_');
                    return (
                      <motion.tr
                        key={listing.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-[#f8f9fa] transition-colors"
                      >
                        {/* Listing name + thumbnail */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {listing.heroImageUrl && (
                              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl">
                                <Image src={listing.heroImageUrl} alt={listing.name} fill className="object-cover" sizes="64px" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-[#202124] text-[15px] truncate max-w-48">{listing.name}</p>
                              <p className="text-[13px] text-[#5f6368]">{listing.address.neighborhood}, {listing.address.city}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span className={cn('rounded-full px-3 py-1 text-[13px] font-medium', STATUS_STYLES[statusKey] ?? STATUS_STYLES.AVAILABLE)}>
                            {STATUS_LABELS[statusKey] ?? listing.status}
                          </span>
                        </td>

                        {/* Units */}
                        <td className="px-4 py-4">
                          <p className="text-[15px] text-[#202124]">{totalAvailable} <span className="text-[#80868b]">/ {totalUnits}</span></p>
                          <p className="text-[13px] text-[#80868b]">available</p>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-4">
                          <p className="text-[15px] font-medium text-[#202124]">{formatRent(listing.priceFrom)}</p>
                          <p className="text-[13px] text-[#80868b]">/mo</p>
                        </td>

                        {/* Tours */}
                        <td className="px-4 py-4">
                          <div className="flex gap-1.5">
                            {listing.showCinematicTour && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#fef7e0] px-2.5 py-0.5 text-xs font-medium text-[#b06000]">
                                <Film size={10} /> Cinematic
                              </span>
                            )}
                            {listing.show3DTour && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-medium text-[#1967d2]">
                                <Box size={10} /> 3D
                              </span>
                            )}
                            {!listing.showCinematicTour && !listing.show3DTour && (
                              <span className="text-[13px] text-[#80868b]">—</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/rent/${listing.slug}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                              title="View live"
                            >
                              <Eye size={14} />
                            </Link>
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setMenuOpen(menuOpen === listing.id ? null : listing.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
                              >
                                <MoreHorizontal size={14} />
                              </button>
                              {menuOpen === listing.id && (
                                <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-2xl border border-[#dadce0] bg-white py-1 shadow-lg">
                                  {['Edit Units', 'View Analytics', 'Update Availability', 'Duplicate', 'Archive'].map((action) => (
                                    <button
                                      key={action}
                                      onClick={() => setMenuOpen(null)}
                                      className="block w-full px-4 py-2.5 text-left text-sm text-[#3c4043] hover:text-[#202124] hover:bg-[#f8f9fa] transition-colors cursor-pointer"
                                    >
                                      {action}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add more CTA */}
          <div className="rounded-3xl border border-dashed border-[#dadce0] bg-white p-10 text-center">
            <Home size={32} className="mx-auto mb-3 text-[#dadce0]" />
            <p className="text-base font-medium text-[#202124]">Ready to add another listing?</p>
            <Link href="/dashboard/rentals/new">
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
