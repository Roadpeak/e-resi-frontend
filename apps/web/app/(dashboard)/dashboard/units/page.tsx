'use client';

import { useQueries } from '@tanstack/react-query';
import { formatPrice, cn } from '../../../../lib/utils';
import { BedDouble, Bath, Maximize2, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { useMyProperties } from '../../../../lib/api/queries';
import { propertiesApi } from '../../../../lib/api/properties';

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; chip: string }> = {
  available: { label: 'Available', icon: CheckCircle2, chip: 'bg-[#e6f4ea] text-[#188038]' },
  reserved: { label: 'Reserved', icon: Clock, chip: 'bg-[#fef7e0] text-[#b06000]' },
  sold: { label: 'Sold', icon: XCircle, chip: 'bg-[#fce8e6] text-[#c5221f]' },
};

export default function DashboardUnits() {
  const { data: propertiesData, isLoading: loadingList } = useMyProperties({ limit: 50 });
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
        <Loader2 size={24} className="animate-spin text-[#1a73e8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Units</h2>
        <p className="text-base text-[#5f6368] mt-0.5">All units across your portfolio</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available', count: available, color: 'text-[#188038]', bg: 'bg-[#e6f4ea]' },
          { label: 'Reserved', count: reserved, color: 'text-[#b06000]', bg: 'bg-[#fef7e0]' },
          { label: 'Sold', count: sold, color: 'text-[#c5221f]', bg: 'bg-[#fce8e6]' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={cn('rounded-3xl border border-transparent p-6 text-center', bg)}>
            <p className={cn('text-[32px] font-normal leading-tight', color)}>{count}</p>
            <p className="text-[15px] text-[#5f6368] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {allUnits.length === 0 ? (
        <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center text-base text-[#5f6368]">
          No units found. Add properties with units to see them here.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#dadce0]">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {allUnits.map((u) => {
                  const config = statusConfig[normalizeStatus(u.status)] ?? statusConfig.available;
                  const Icon = config.icon;
                  return (
                    <tr key={u.id} className="hover:bg-[#f8f9fa] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-[15px] font-medium text-[#202124]">{u.name}</p>
                        {u.floor != null && <p className="text-[13px] text-[#80868b]">Floor {u.floor}</p>}
                      </td>
                      <td className="px-4 py-4 text-[15px] text-[#5f6368]">{u.propertyName}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 text-[13px] text-[#5f6368]">
                          <span className="flex items-center gap-1"><BedDouble size={13} />{u.bedrooms === 0 ? 'Studio' : `${u.bedrooms}BR`}</span>
                          <span className="flex items-center gap-1"><Bath size={13} />{u.bathrooms}</span>
                          {u.sqm && <span className="flex items-center gap-1"><Maximize2 size={13} />{u.sqm}sqm</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[15px] font-medium text-[#202124]">{formatPrice(u.price, u.currency)}</td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium', config.chip)}>
                          <Icon size={12} /> {config.label}
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
