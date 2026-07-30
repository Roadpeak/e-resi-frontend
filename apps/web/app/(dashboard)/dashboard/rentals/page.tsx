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
  AVAILABLE: 'bg-green-500/15 text-green-400 border border-green-500/20',
  PARTIALLY_AVAILABLE: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  FULLY_LET: 'bg-white/5 text-white/30 border border-white/10',
  ARCHIVED: 'bg-white/5 text-white/20 border border-white/5',
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
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Rent Listings</h2>
          <p className="text-sm text-white/40 mt-0.5">{listings.length} active listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/rentals/new">
          <Button icon={<Plus size={15} />}>New Listing</Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-surface-900/50 p-16 text-center">
          <Home size={32} className="mx-auto mb-3 text-white/20" />
          <p className="text-sm font-medium text-white/50">No rent listings yet</p>
          <p className="text-xs text-white/25 mt-1">Create a rent listing and connect it to your property with available unit types.</p>
          <Link href="/dashboard/rentals/new">
            <Button size="sm" className="mt-4" icon={<Plus size={13} />}>New Listing</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Listing</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Units</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Price From</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Tours</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
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
                        className="hover:bg-white/[0.02] transition-colors"
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
                              <p className="font-medium text-white text-sm truncate max-w-48">{listing.name}</p>
                              <p className="text-xs text-white/40">{listing.address.neighborhood}, {listing.address.city}</p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_STYLES[statusKey] ?? STATUS_STYLES.AVAILABLE)}>
                            {STATUS_LABELS[statusKey] ?? listing.status}
                          </span>
                        </td>

                        {/* Units */}
                        <td className="px-4 py-4">
                          <p className="text-sm text-white">{totalAvailable} <span className="text-white/30">/ {totalUnits}</span></p>
                          <p className="text-xs text-white/30">available</p>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-white">{formatRent(listing.priceFrom)}</p>
                          <p className="text-xs text-white/30">/mo</p>
                        </td>

                        {/* Tours */}
                        <td className="px-4 py-4">
                          <div className="flex gap-1.5">
                            {listing.showCinematicTour && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-warm-500/20 bg-warm-500/10 px-2 py-0.5 text-[10px] text-warm-400">
                                <Film size={9} /> Cinematic
                              </span>
                            )}
                            {listing.show3DTour && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/20 bg-brand-500/10 px-2 py-0.5 text-[10px] text-brand-300">
                                <Box size={9} /> 3D
                              </span>
                            )}
                            {!listing.showCinematicTour && !listing.show3DTour && (
                              <span className="text-xs text-white/20">—</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/rent/${listing.slug}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                              title="View live"
                            >
                              <Eye size={14} />
                            </Link>
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setMenuOpen(menuOpen === listing.id ? null : listing.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                <MoreHorizontal size={14} />
                              </button>
                              {menuOpen === listing.id && (
                                <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-white/10 bg-surface-700 shadow-2xl shadow-black/40">
                                  {['Edit Units', 'View Analytics', 'Update Availability', 'Duplicate', 'Archive'].map((action) => (
                                    <button
                                      key={action}
                                      onClick={() => setMenuOpen(null)}
                                      className="block w-full px-4 py-2.5 text-left text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
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
          <div className="rounded-2xl border border-dashed border-white/10 bg-surface-900/50 p-10 text-center">
            <Home size={32} className="mx-auto mb-3 text-white/20" />
            <p className="text-sm font-medium text-white/50">Ready to add another listing?</p>
            <Link href="/dashboard/rentals/new">
              <Button size="sm" className="mt-4" icon={<Plus size={13} />}>New Listing</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
