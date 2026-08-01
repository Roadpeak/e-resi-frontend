'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Eye, Pencil, Box, Headset, Building2, MoreHorizontal, Loader2 } from 'lucide-react';
import { formatPrice, getStatusLabel, getStatusColor, cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { useMyProperties } from '../../../../lib/api/queries';

export default function DashboardProperties() {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { data, isLoading } = useMyProperties({ limit: 50 });
  const properties = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Properties</h2>
          <p className="text-sm text-gray-500 mt-0.5">{properties.length} development{properties.length !== 1 ? 's' : ''} in your portfolio</p>
        </div>
        <Button href="/dashboard/developments/new" icon={<Plus size={15} />}>Add Development</Button>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">No properties yet</p>
          <p className="text-xs text-gray-400 mt-1">List a property and start receiving inquiries within minutes.</p>
          <Button href="/dashboard/developments/new" size="sm" className="mt-4" icon={<Plus size={13} />}>Add Development</Button>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Property</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Units</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Price From</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Features</th>
                    <th className="px-4 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {properties.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Property name + thumbnail */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl">
                            {p.heroImageUrl ? (
                              <Image src={p.heroImageUrl} alt={p.name} fill className="object-cover" sizes="64px" />
                            ) : (
                              <div className="h-full w-full bg-gray-100" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate max-w-48">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.address?.neighborhood ?? '—'}, {p.address?.city ?? '—'}</p>
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
                        <p className="text-sm text-gray-900">{p.availableUnits} <span className="text-gray-400">/ {p.totalUnits}</span></p>
                        <p className="text-xs text-gray-400">available</p>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">{formatPrice(p.priceFrom, p.currency)}</p>
                      </td>

                      {/* Features */}
                      <td className="px-4 py-4">
                        <div className="flex gap-1.5">
                          {p.has3DTour && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700">
                              <Box size={9} /> 3D
                            </span>
                          )}
                          {p.hasVRTour && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">
                              <Headset size={9} /> VR
                            </span>
                          )}
                          {p.hasDigitalTwin && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
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
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            title="View live"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            {menuOpen === p.id && (
                              <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                                {['Manage Units', 'View Analytics', 'Upload Media', 'Duplicate', 'Archive'].map((action) => (
                                  <button
                                    key={action}
                                    onClick={() => setMenuOpen(null)}
                                    className="block w-full px-4 py-2.5 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
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
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <Building2 size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Ready to add your next development?</p>
            <p className="text-xs text-gray-400 mt-1">List a property and start receiving inquiries within minutes.</p>
            <Button href="/dashboard/developments/new" size="sm" className="mt-4" icon={<Plus size={13} />}>Add Development</Button>
          </div>
        </>
      )}
    </div>
  );
}
