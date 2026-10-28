'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { apiClient, ApiError } from '../../lib/api/client';
import { floorPlansApi } from '../../lib/api/floor-plans';
import { formatPrice } from '../../lib/utils';

const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';

/* ── Units management (add / update status / remove) ─────────────── */

interface UnitRow {
  id: string;
  name: string;
  floor?: number | null;
  bedrooms: number;
  bathrooms?: number | null;
  sqm?: number | null;
  price: number;
  status: string;
}

const UNIT_STATUSES = ['AVAILABLE', 'RESERVED', 'SOLD'] as const;
const UNIT_STATUS_CLS: Record<string, string> = {
  AVAILABLE: 'bg-[#e6f4ea] text-[#188038]',
  RESERVED: 'bg-[#fef7e0] text-[#b06000]',
  SOLD: 'bg-[#f1f3f4] text-[#5f6368]',
};

export function UnitsManager({ slug, currency, units }: { slug: string; currency: string; units: UnitRow[] }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', floor: '', bedrooms: '', bathrooms: '', sqm: '', price: '', status: 'AVAILABLE',
    floorPlanId: '',
  });

  /**
   * The layouts published for this development.
   *
   * Offered on the unit form because a unit with no plan of its own falls back
   * to matching on bedroom count, and that fallback declines to guess when a
   * bedroom count has more than one layout — which is exactly when naming it
   * here is the only way the buyer sees a drawing.
   */
  const { data: plans = [] } = useQuery({
    queryKey: ['floor-plans', slug],
    queryFn: () => floorPlansApi.list(slug),
  });
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dash-property', slug] });
    queryClient.invalidateQueries({ queryKey: ['my-properties'] });
  };

  async function addUnit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const price = Number.parseFloat(form.price);
    if (!form.name.trim()) return setError('Give the unit a name, e.g. "A-101" or "2 Bed Deluxe".');
    if (!Number.isFinite(price) || price <= 0) return setError('Enter a valid unit price.');
    setSaving(true);
    try {
      await apiClient.post(`/properties/${slug}/units`, {
        name: form.name.trim(),
        floor: form.floor ? Number.parseInt(form.floor, 10) : undefined,
        bedrooms: form.bedrooms ? Number.parseInt(form.bedrooms, 10) : undefined,
        bathrooms: form.bathrooms ? Number.parseInt(form.bathrooms, 10) : undefined,
        sqm: form.sqm ? Number.parseFloat(form.sqm) : undefined,
        price,
        status: form.status,
        floorPlanId: form.floorPlanId || undefined,
      });
      setForm({
        name: '', floor: '', bedrooms: '', bathrooms: '', sqm: '', price: '', status: 'AVAILABLE',
        floorPlanId: '',
      });
      setAdding(false);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add the unit.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(unit: UnitRow, status: string) {
    if (status === unit.status) return;
    setBusyId(unit.id);
    setError('');
    try {
      await apiClient.patch(`/properties/${slug}/units/${unit.id}`, { status });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the unit.');
    } finally {
      setBusyId(null);
    }
  }

  async function removeUnit(unit: UnitRow) {
    setBusyId(unit.id);
    setError('');
    try {
      await apiClient.delete(`/properties/${slug}/units/${unit.id}`);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove the unit.');
    } finally {
      setBusyId(null);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
      <div className="flex items-center justify-between border-b border-[#f1f3f4] px-6 py-4">
        <div>
          <h3 className="text-[18px] font-normal text-[#202124]">Units ({units.length})</h3>
          <p className="text-sm text-[#5f6368]">Inventory buyers can inquire about and reserve.</p>
        </div>
        <button
          onClick={() => { setAdding((v) => !v); setError(''); }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer"
        >
          {adding ? <X size={14} /> : <Plus size={14} />} {adding ? 'Cancel' : 'Add unit'}
        </button>
      </div>

      {adding && (
        <form onSubmit={addUnit} className="border-b border-[#f1f3f4] bg-[#f8f9fa] px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Unit name</label>
              <input value={form.name} onChange={set('name')} required placeholder="A-101 · 2 Bed Deluxe" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Price ({currency})</label>
              <input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^\d.]/g, '') }))} required inputMode="numeric" placeholder="8500000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Floor</label>
              <input value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value.replace(/\D/g, '') }))} inputMode="numeric" placeholder="1" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bedrooms</label>
              <input value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value.replace(/\D/g, '') }))} inputMode="numeric" placeholder="2" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bathrooms</label>
              <input value={form.bathrooms} onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value.replace(/\D/g, '') }))} inputMode="numeric" placeholder="2" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Size (m²)</label>
              <input value={form.sqm} onChange={(e) => setForm((f) => ({ ...f, sqm: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="numeric" placeholder="120" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                {UNIT_STATUSES.map((st) => (
                  <option key={st} value={st}>{st.charAt(0) + st.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            {plans.length > 0 && (
              <div className="sm:col-span-2">
                <label className={labelCls}>Floor plan</label>
                <select value={form.floorPlanId} onChange={set('floorPlanId')} className={inputCls}>
                  <option value="">Match automatically by bedrooms</option>
                  {plans.map((fp) => (
                    <option key={fp.id} value={fp.id}>
                      {fp.name}
                      {fp.bedrooms == null ? '' : ` · ${fp.bedrooms === 0 ? 'Studio' : `${fp.bedrooms} bed`}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add unit
              </button>
            </div>
          </div>
        </form>
      )}

      {error && <p className="mx-6 mt-4 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}

      {units.length === 0 && !adding ? (
        <div className="px-6 py-10 text-center">
          <p className="text-base text-[#5f6368]">No units yet — add your first one so buyers can reserve.</p>
          <button
            onClick={() => setAdding(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add unit
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[#f1f3f4]">
          {units.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-[#202124]">{u.name}</p>
                <p className="text-[13px] text-[#5f6368]">
                  {[
                    u.floor != null ? `floor ${u.floor}` : null,
                    u.bedrooms ? `${u.bedrooms} bed` : null,
                    u.bathrooms ? `${u.bathrooms} bath` : null,
                    u.sqm ? `${u.sqm} m²` : null,
                  ].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <span className="text-[15px] tabular-nums text-[#202124]">{formatPrice(u.price, currency)}</span>
              <div className="relative">
                <select
                  value={u.status}
                  disabled={busyId === u.id}
                  onChange={(e) => updateStatus(u, e.target.value)}
                  className={`appearance-none rounded-full border-0 py-1 pl-3 pr-7 text-[13px] font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 ${UNIT_STATUS_CLS[u.status] ?? 'bg-[#f1f3f4] text-[#5f6368]'}`}
                >
                  {UNIT_STATUSES.map((st) => (
                    <option key={st} value={st}>{st.charAt(0) + st.slice(1).toLowerCase()}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px]">▾</span>
              </div>
              <button
                onClick={() => removeUnit(u)}
                disabled={busyId === u.id}
                aria-label={`Remove ${u.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#80868b] hover:bg-[#fce8e6] hover:text-[#c5221f] transition-colors cursor-pointer disabled:opacity-50"
              >
                {busyId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
