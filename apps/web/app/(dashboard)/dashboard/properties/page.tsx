'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Eye, Pencil, Box, Headset, Building2, MoreHorizontal, Loader2 } from 'lucide-react';
import { formatPrice, getStatusLabel, cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { useMyProperties } from '../../../../lib/api/queries';

/** Google-tonal status chips (replaces the old brand/gold/emerald palette). */
const STATUS_CHIPS: Record<string, string> = {
  off_plan: 'bg-[#e8f0fe] text-[#1967d2]',
  under_construction: 'bg-[#fef7e0] text-[#b06000]',
  ready: 'bg-[#e6f4ea] text-[#188038]',
  sold_out: 'bg-[#fce8e6] text-[#c5221f]',
};

export default function DashboardProperties() {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { data, isLoading } = useMyProperties({ limit: 50 });
  const properties = data?.items ?? [];

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
          <h2 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Your properties</h2>
          <p className="text-base text-[#5f6368] mt-0.5">{properties.length} development{properties.length !== 1 ? 's' : ''} in your portfolio</p>
        </div>
        <Button
          href="/dashboard/developments/new"
          icon={<Plus size={15} />}
          className="rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-[15px] font-medium shadow-none"
        >
          Add Development
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dadce0] bg-white p-16 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-[#dadce0]" />
          <p className="text-base font-medium text-[#202124]">No properties yet</p>
          <p className="text-base text-[#5f6368] mt-1">List a property and start receiving inquiries within minutes.</p>
          <Button
            href="/dashboard/developments/new"
            className="mt-5 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-[15px] font-medium shadow-none"
            icon={<Plus size={14} />}
          >
            Add Development
          </Button>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#dadce0]">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Property</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Units</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Price From</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Features</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {properties.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-[#f8f9fa] transition-colors"
                    >
                      {/* Property name + thumbnail */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl">
                            {p.heroImageUrl ? (
                              <Image src={p.heroImageUrl} alt={p.name} fill className="object-cover" sizes="64px" />
                            ) : (
                              <div className="h-full w-full bg-[#f1f3f4]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#202124] text-[15px] truncate max-w-48">{p.name}</p>
                            <p className="text-[13px] text-[#5f6368]">{p.address?.neighborhood ?? '—'}, {p.address?.city ?? '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={cn('rounded-full px-3 py-1 text-[13px] font-medium', STATUS_CHIPS[p.status] ?? 'bg-[#f1f3f4] text-[#5f6368]')}>
                          {getStatusLabel(p.status)}
                        </span>
                      </td>

                      {/* Units */}
                      <td className="px-4 py-4">
                        <p className="text-[15px] text-[#202124]">{p.availableUnits} <span className="text-[#80868b]">/ {p.totalUnits}</span></p>
                        <p className="text-[13px] text-[#80868b]">available</p>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4">
                        <p className="text-[15px] font-medium text-[#202124]">{formatPrice(p.priceFrom, p.currency)}</p>
                      </td>

                      {/* Features */}
                      <td className="px-4 py-4">
                        <div className="flex gap-1.5">
                          {p.has3DTour && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-medium text-[#1967d2]">
                              <Box size={10} /> 3D
                            </span>
                          )}
                          {p.hasVRTour && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f4] px-2.5 py-0.5 text-xs font-medium text-[#5f6368]">
                              <Headset size={10} /> VR
                            </span>
                          )}
                          {p.hasDigitalTwin && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-xs font-medium text-[#188038]">
                              ✦ Twin
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={p.status === 'ACTIVE' || p.status === 'OFF_PLAN' ? `/${p.slug}` : `/dashboard/properties/${p.slug}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                            title="View"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            href={`/dashboard/properties/${p.slug}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </Link>
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            {menuOpen === p.id && (
                              <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-2xl border border-[#dadce0] bg-white py-1 shadow-lg">
                                {[
                                  { label: 'View & edit details', href: `/dashboard/properties/${p.slug}` },
                                  { label: 'Manage units', href: '/dashboard/units' },
                                  { label: 'View analytics', href: '/dashboard/analytics' },
                                  { label: 'Billing for this listing', href: '/dashboard/billing' },
                                ].map((action) => (
                                  <Link
                                    key={action.label}
                                    href={action.href}
                                    onClick={() => setMenuOpen(null)}
                                    className="block w-full px-4 py-2.5 text-left text-sm text-[#3c4043] hover:text-[#202124] hover:bg-[#f8f9fa] transition-colors"
                                  >
                                    {action.label}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add more CTA */}
          <div className="rounded-3xl border border-dashed border-[#dadce0] bg-white p-10 text-center">
            <Building2 size={32} className="mx-auto mb-3 text-[#dadce0]" />
            <p className="text-base font-medium text-[#202124]">Ready to add your next development?</p>
            <p className="text-base text-[#5f6368] mt-1">List a property and start receiving inquiries within minutes.</p>
            <Button
              href="/dashboard/developments/new"
              className="mt-5 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-[15px] font-medium shadow-none"
              icon={<Plus size={14} />}
            >
              Add Development
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
