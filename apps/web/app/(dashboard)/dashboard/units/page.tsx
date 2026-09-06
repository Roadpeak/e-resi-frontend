'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPrice, cn } from '../../../../lib/utils';
import { BedDouble, Bath, Maximize2, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { unitsApi, type PortfolioUnit, type UnitStatus } from '../../../../lib/api/units';

/**
 * The allocation board.
 *
 * This page used to be a status column and nothing else — a unit said
 * RESERVED with no way to see reserved *for whom*, which is exactly the gap
 * the market's double-allocation problem lives in. Every unit now carries
 * its holder: the live deal (client and agent, linking straight into the
 * deal record) or the platform reservation behind the status. Statuses set
 * by the deal pipeline maintain themselves; the manual override remains for
 * sales that happened off-platform.
 */

const statusConfig: Record<UnitStatus, { label: string; icon: typeof CheckCircle2; chip: string }> = {
  AVAILABLE: { label: 'Available', icon: CheckCircle2, chip: 'bg-[#e6f4ea] text-[#188038]' },
  RESERVED: { label: 'Reserved', icon: Clock, chip: 'bg-[#fef7e0] text-[#b06000]' },
  SOLD: { label: 'Sold', icon: XCircle, chip: 'bg-[#fce8e6] text-[#c5221f]' },
};

function HolderCell({ unit }: { unit: PortfolioUnit }) {
  if (unit.activeDeal) {
    return (
      <Link
        href={`/dashboard/deals/${unit.activeDeal.id}`}
        className="block max-w-[220px] truncate text-[13px] text-[#1a73e8] hover:underline"
        title="Open the deal"
      >
        {unit.activeDeal.clientName}
        <span className="text-[#5f6368]"> via {unit.activeDeal.agent.displayName}</span>
      </Link>
    );
  }
  if (unit.activeReservation) {
    return (
      <span className="block max-w-[220px] truncate text-[13px] text-[#5f6368]">
        {unit.activeReservation.user.firstName} {unit.activeReservation.user.lastName}
        <span className="text-[#80868b]"> · reserved on-platform</span>
      </span>
    );
  }
  return <span className="text-[13px] text-[#bdc1c6]">—</span>;
}

function StatusCell({ unit }: { unit: PortfolioUnit }) {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: (status: UnitStatus) => unitsApi.updateStatus(unit.property.slug, unit.id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['units-portfolio'] }),
  });

  // A unit held by a live deal manages its own status — the pipeline moves
  // it, and a manual flip would silently disagree with the deal that owns
  // it. The dropdown appears only where a human is the source of truth.
  if (unit.activeDeal) {
    const config = statusConfig[unit.status] ?? statusConfig.AVAILABLE;
    const Icon = config.icon;
    return (
      <span
        className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium', config.chip)}
        title="Managed by its deal — move the deal to change it"
      >
        <Icon size={12} /> {config.label}
      </span>
    );
  }

  return (
    <select
      value={unit.status}
      disabled={update.isPending}
      onChange={(e) => update.mutate(e.target.value as UnitStatus)}
      className={cn(
        'cursor-pointer rounded-full border-0 px-3 py-1 text-[13px] font-medium outline-none',
        (statusConfig[unit.status] ?? statusConfig.AVAILABLE).chip,
      )}
    >
      <option value="AVAILABLE">Available</option>
      <option value="RESERVED">Reserved</option>
      <option value="SOLD">Sold</option>
    </select>
  );
}

export default function DashboardUnits() {
  const { data: units, isLoading } = useQuery({
    queryKey: ['units-portfolio'],
    queryFn: unitsApi.portfolio,
  });
  const [statusFilter, setStatusFilter] = useState<UnitStatus | ''>('');
  const [propertyFilter, setPropertyFilter] = useState('');

  const all = units ?? [];
  const properties = useMemo(
    () => [...new Map(all.map((u) => [u.property.id, u.property])).values()],
    [all],
  );
  const filtered = all.filter(
    (u) =>
      (!statusFilter || u.status === statusFilter) &&
      (!propertyFilter || u.property.id === propertyFilter),
  );

  const count = (s: UnitStatus) => all.filter((u) => u.status === s).length;

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
        <p className="text-base text-[#5f6368] mt-0.5">
          Your whole inventory, with who holds what — statuses follow the deals
          that move them.
        </p>
      </div>

      {/* Summary — clicking a card filters the board. */}
      <div className="grid grid-cols-3 gap-4">
        {(
          [
            ['AVAILABLE', 'text-[#188038]', 'bg-[#e6f4ea]'],
            ['RESERVED', 'text-[#b06000]', 'bg-[#fef7e0]'],
            ['SOLD', 'text-[#c5221f]', 'bg-[#fce8e6]'],
          ] as [UnitStatus, string, string][]
        ).map(([s, color, bg]) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={cn(
              'cursor-pointer rounded-3xl border p-6 text-center transition-all',
              bg,
              statusFilter === s ? 'border-[#1a73e8]' : 'border-transparent',
            )}
          >
            <p className={cn('text-[32px] font-normal leading-tight', color)}>{count(s)}</p>
            <p className="text-[15px] text-[#5f6368] mt-1">{statusConfig[s].label}</p>
          </button>
        ))}
      </div>

      {properties.length > 1 && (
        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="h-10 rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]"
        >
          <option value="">All properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center text-base text-[#5f6368]">
          {all.length === 0
            ? 'No units found. Add properties with units to see them here.'
            : 'Nothing matches the current filter.'}
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
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Held by</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-6 py-4">
                      {/* The row's name opens per-unit management — status,
                          owner, rentals, deals, and the unit's own media. */}
                      <Link href={`/dashboard/units/${u.id}`} className="text-[15px] font-medium text-[#1a73e8] hover:underline">
                        {u.name}
                      </Link>
                      {u.floor != null && <p className="text-[13px] text-[#80868b]">Floor {u.floor}</p>}
                    </td>
                    <td className="px-4 py-4 text-[15px] text-[#5f6368]">{u.property.name}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-[13px] text-[#5f6368]">
                        <span className="flex items-center gap-1"><BedDouble size={13} />{u.bedrooms === 0 ? 'Studio' : `${u.bedrooms}BR`}</span>
                        <span className="flex items-center gap-1"><Bath size={13} />{u.bathrooms}</span>
                        {u.sqm && <span className="flex items-center gap-1"><Maximize2 size={13} />{u.sqm}sqm</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[15px] font-medium text-[#202124]">{formatPrice(u.price, u.currency)}</td>
                    <td className="px-4 py-4"><HolderCell unit={u} /></td>
                    <td className="px-4 py-4"><StatusCell unit={u} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
