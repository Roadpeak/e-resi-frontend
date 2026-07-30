'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Eye, Pencil, Box, Headset, Building2, MoreHorizontal, Loader2 } from 'lucide-react';
import { formatPrice, getStatusLabel, getStatusColor, cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { useProperties } from '../../../../lib/api/queries';

export default function DashboardProperties() {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { data, isLoading } = useProperties({ limit: 50 });
  const properties = data?.items ?? [];

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
          <h2 className="text-xl font-semibold text-white">Your Properties</h2>
          <p className="text-sm text-white/40 mt-0.5">{properties.length} development{properties.length !== 1 ? 's' : ''} in your portfolio</p>
        </div>
        <Button icon={<Plus size={15} />}>Add Property</Button>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-surface-900/50 p-16 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-white/20" />
          <p className="text-sm font-medium text-white/50">No properties yet</p>
          <p className="text-xs text-white/25 mt-1">List a property and start receiving inquiries within minutes.</p>
          <Button size="sm" className="mt-4" icon={<Plus size={13} />}>Add Property</Button>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Property</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Units</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Price From</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Features</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-white/30">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {properties.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Property name + thumbnail */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl">
                            {p.heroImageUrl ? (
                              <Image src={p.heroImageUrl} alt={p.name} fill className="object-cover" sizes="64px" />
                            ) : (
                              <div className="h-full w-full bg-surface-700" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white text-sm truncate max-w-48">{p.name}</p>
                            <p className="text-xs text-white/40">{p.address?.neighborhood ?? '—'}, {p.address?.city ?? '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', getStatusColor(p.status))}>
                          {getStatusLabel(p.status)}
                        </span>
                      </td>

                      {/* Units */}
                      <td className="px-4 py-4">
                        <p className="text-sm text-white">{p.availableUnits} <span className="text-white/30">/ {p.totalUnits}</span></p>
                        <p className="text-xs text-white/30">available</p>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-white">{formatPrice(p.priceFrom, p.currency)}</p>
                      </td>

                      {/* Features */}
                      <td className="px-4 py-4">
                        <div className="flex gap-1.5">
                          {p.has3DTour && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/20 bg-brand-500/10 px-2 py-0.5 text-[10px] text-brand-300">
                              <Box size={9} /> 3D
                            </span>
                          )}
                          {p.hasVRTour && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">
                              <Headset size={9} /> VR
                            </span>
                          )}
                          {p.hasDigitalTwin && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                              ✦ Twin
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/${p.slug}`}
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
                              onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            {menuOpen === p.id && (
                              <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-white/10 bg-surface-700 shadow-2xl shadow-black/40">
                                {['Manage Units', 'View Analytics', 'Upload Media', 'Duplicate', 'Archive'].map((action) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add more CTA */}
          <div className="rounded-2xl border border-dashed border-white/10 bg-surface-900/50 p-10 text-center">
            <Building2 size={32} className="mx-auto mb-3 text-white/20" />
            <p className="text-sm font-medium text-white/50">Ready to add your next development?</p>
            <p className="text-xs text-white/25 mt-1">List a property and start receiving inquiries within minutes.</p>
            <Button size="sm" className="mt-4" icon={<Plus size={13} />}>Add Property</Button>
          </div>
        </>
      )}
    </div>
  );
}
