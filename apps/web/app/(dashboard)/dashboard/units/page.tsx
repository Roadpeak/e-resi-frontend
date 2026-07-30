'use client';

import { useQueries } from '@tanstack/react-query';
import { formatPrice, cn } from '../../../../lib/utils';
import { BedDouble, Bath, Maximize2, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { useProperties } from '../../../../lib/api/queries';
import { propertiesApi } from '../../../../lib/api/properties';

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  available: { label: 'Available', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  reserved: { label: 'Reserved', icon: Clock, color: 'text-gold-400', bg: 'bg-gold-500/10 border-gold-500/20' },
  sold: { label: 'Sold', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function DashboardUnits() {
  const { data: propertiesData, isLoading: loadingList } = useProperties({ limit: 50 });
  const slugs = propertiesData?.items.map((p) => p.slug) ?? [];

  // Fetch each property detail to get units
  const detailQueries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ['property', slug],
      queryFn: () => propertiesApi.get(slug),
      enabled: slugs.length > 0,
    })),
  });

  const isLoading = loadingList || detailQueries.some((q) => q.isLoading);

  const allUnits = detailQueries.flatMap((q) => {
    const p = q.data;
    if (!p || !p.units) return [];
    return p.units.map((u) => ({ ...u, propertyName: p.name, currency: p.currency ?? 'KES' }));
  });

  const normalizeStatus = (s: string) => s.toLowerCase();
  const available = allUnits.filter((u) => normalizeStatus(u.status) === 'available').length;
  const reserved = allUnits.filter((u) => normalizeStatus(u.status) === 'reserved').length;
  const sold = allUnits.filter((u) => normalizeStatus(u.status) === 'sold').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-xl font-semibold text-white">Units</h2>
        <p className="text-sm text-white/40 mt-0.5">All units across your portfolio</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available', count: available, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Reserved', count: reserved, color: 'text-gold-400', bg: 'bg-gold-500/10 border-gold-500/20' },
          { label: 'Sold', count: sold, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={cn('rounded-2xl border p-5 text-center', bg)}>
            <p className={cn('text-3xl font-semibold', color)}>{count}</p>
            <p className="text-sm text-white/50 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {allUnits.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-surface-800 px-6 py-16 text-center text-sm text-white/30">
          No units found. Add properties with units to see them here.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allUnits.map((u) => {
                  const config = statusConfig[normalizeStatus(u.status)] ?? statusConfig.available;
                  const Icon = config.icon;
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        {u.floor != null && <p className="text-xs text-white/30">Floor {u.floor}</p>}
                      </td>
                      <td className="px-4 py-4 text-sm text-white/60">{u.propertyName}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 text-xs text-white/40">
                          <span className="flex items-center gap-1"><BedDouble size={12} />{u.bedrooms === 0 ? 'Studio' : `${u.bedrooms}BR`}</span>
                          <span className="flex items-center gap-1"><Bath size={12} />{u.bathrooms}</span>
                          {u.sqm && <span className="flex items-center gap-1"><Maximize2 size={12} />{u.sqm}sqm</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-white">{formatPrice(u.price, u.currency)}</td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', config.bg, config.color)}>
                          <Icon size={10} /> {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
