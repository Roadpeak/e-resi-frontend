'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { pricingApi, type PricingTier, type ServiceItem } from '../../../../lib/api/admin';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white';
const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2 text-[15px] text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';

type Tab = 'tiers' | 'services' | 'fee';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'tiers', label: 'Production tiers', icon: 'layers' },
  { key: 'services', label: 'Service catalogue', icon: 'inventory_2' },
  { key: 'fee', label: 'Listing fee', icon: 'receipt_long' },
];

const CATEGORY_LABELS: Record<string, string> = {
  CAPTURE: 'Photography & Film',
  IMMERSIVE: 'Immersive & 3D',
  MARKETING: 'Marketing Content',
  DESIGN: 'Design & Branding',
};

export default function AdminPricing() {
  const [tab, setTab] = useState<Tab>('tiers');
  const queryClient = useQueryClient();
  const [toast, setToast] = useState('');

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 3000);
  };
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-tiers'] });
    queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
  };

  const seed = useMutation({
    mutationFn: pricingApi.seed,
    onSuccess: (r) => {
      invalidate();
      flash(`Seeded ${r.tiers} tiers, ${r.services} services, ${r.settings} settings`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Pricing</h1>
          <p className="text-[14px] text-[#5f6368]">
            What developers pay — production tiers, à-la-carte services and the monthly listing fee.
          </p>
        </div>
        <button
          onClick={() => seed.mutate()}
          disabled={seed.isPending}
          className="rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] cursor-pointer disabled:opacity-50"
        >
          {seed.isPending ? 'Seeding…' : 'Seed defaults'}
        </button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">
          <MaterialIcon name="check_circle" size={18} fill /> {toast}
        </div>
      )}

      <div className="flex gap-1 border-b border-[#dadce0]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-[14px] font-medium transition-colors cursor-pointer',
              tab === t.key
                ? 'border-[#1a73e8] text-[#1a73e8]'
                : 'border-transparent text-[#5f6368] hover:text-[#202124]',
            )}
          >
            <MaterialIcon name={t.icon} size={18} fill={tab === t.key} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tiers' && <TiersTab onSaved={flash} />}
      {tab === 'services' && <ServicesTab onSaved={flash} />}
      {tab === 'fee' && <ListingFeeTab onSaved={flash} />}
    </div>
  );
}

/* ── Production tiers ───────────────────────────────────────────── */

function TiersTab({ onSaved }: { onSaved: (m: string) => void }) {
  const queryClient = useQueryClient();
  const { data: tiers, isLoading } = useQuery({
    queryKey: ['admin-tiers'],
    queryFn: pricingApi.tiers,
  });

  if (isLoading) return <Loading />;
  if (!tiers?.length) return <Empty label="No tiers yet — use “Seed defaults”." />;

  return (
    <div className="space-y-3">
      {tiers.map((t) => (
        <TierRow
          key={t.id}
          tier={t}
          onSaved={(m) => {
            queryClient.invalidateQueries({ queryKey: ['admin-tiers'] });
            onSaved(m);
          }}
        />
      ))}
    </div>
  );
}

function TierRow({ tier, onSaved }: { tier: PricingTier; onSaved: (m: string) => void }) {
  const [price, setPrice] = useState(String(tier.price));
  const [currency, setCurrency] = useState(tier.currency);
  const [error, setError] = useState('');
  const dirty = price !== String(tier.price) || currency !== tier.currency;

  // Only fetched when a change is pending, so admins see the blast radius.
  const { data: impact } = useQuery({
    queryKey: ['tier-impact', tier.tier],
    queryFn: () => pricingApi.tierImpact(tier.tier),
    enabled: dirty,
  });

  const save = useMutation({
    mutationFn: () => pricingApi.updateTier(tier.id, { price: Number(price), currency }),
    onSuccess: () => onSaved(`${tier.label} updated`),
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not save'),
  });

  return (
    <div className={cn(cardCls, 'p-5')}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-medium text-[#202124]">{tier.label}</p>
          <p className="text-[12px] uppercase tracking-wide text-[#80868b]">{tier.tier}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
            className={cn(inputCls, 'w-20 text-center')}
            aria-label={`${tier.label} currency`}
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))}
            inputMode="numeric"
            className={cn(inputCls, 'w-36 text-right')}
            aria-label={`${tier.label} price`}
          />
          <button
            onClick={() => save.mutate()}
            disabled={!dirty || save.isPending}
            className="rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] cursor-pointer disabled:opacity-40"
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {dirty && impact && (
        <p className="mt-2 text-[13px] text-[#b06000]">
          <MaterialIcon name="info" size={14} className="align-text-bottom" />{' '}
          {impact.affectedProperties === 0
            ? 'No properties currently on this tier.'
            : `Affects ${impact.affectedProperties} propert${impact.affectedProperties === 1 ? 'y' : 'ies'} on this tier.`}
        </p>
      )}
      {tier.features?.length > 0 && (
        <p className="mt-2 text-[13px] text-[#5f6368]">{tier.features.join(' · ')}</p>
      )}
      {error && <p className="mt-2 text-[13px] text-[#c5221f]">{error}</p>}
    </div>
  );
}

/* ── Service catalogue ──────────────────────────────────────────── */

function ServicesTab({ onSaved }: { onSaved: (m: string) => void }) {
  const queryClient = useQueryClient();
  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: pricingApi.services,
  });

  if (isLoading) return <Loading />;
  if (!services?.length) return <Empty label="No services yet — use “Seed defaults”." />;

  const grouped = services.reduce<Record<string, ServiceItem[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-2 text-[15px] font-medium text-[#202124]">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="space-y-2">
            {items.map((s) => (
              <ServiceRow
                key={s.id}
                service={s}
                onSaved={(m) => {
                  queryClient.invalidateQueries({ queryKey: ['admin-services'] });
                  onSaved(m);
                }}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ServiceRow({ service, onSaved }: { service: ServiceItem; onSaved: (m: string) => void }) {
  const [price, setPrice] = useState(String(service.price));
  const dirty = price !== String(service.price);

  const save = useMutation({
    mutationFn: () => pricingApi.updateService(service.id, { price: Number(price) }),
    onSuccess: () => onSaved(`${service.label} updated`),
  });
  const retire = useMutation({
    mutationFn: () => pricingApi.retireService(service.id),
    onSuccess: () => onSaved(`${service.label} retired`),
  });

  return (
    <div className={cn(cardCls, 'flex flex-wrap items-center gap-4 p-4', !service.isActive && 'opacity-60')}>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-[#202124]">
          {service.label}
          {!service.isActive && (
            <span className="ml-2 rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[11px] text-[#5f6368]">
              retired
            </span>
          )}
        </p>
        {service.description && (
          <p className="truncate text-[13px] text-[#5f6368]">{service.description}</p>
        )}
      </div>
      <span className="text-[13px] text-[#80868b]">{service.currency}</span>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))}
        inputMode="numeric"
        className={cn(inputCls, 'w-32 text-right')}
        aria-label={`${service.label} price`}
      />
      <button
        onClick={() => save.mutate()}
        disabled={!dirty || save.isPending}
        className="rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] cursor-pointer disabled:opacity-40"
      >
        Save
      </button>
      {service.isActive && (
        <button
          onClick={() => retire.mutate()}
          className="rounded-full border border-[#dadce0] px-3 py-2 text-[13px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6] cursor-pointer"
        >
          Retire
        </button>
      )}
    </div>
  );
}

/* ── Listing fee & billing settings ─────────────────────────────── */

function ListingFeeTab({ onSaved }: { onSaved: (m: string) => void }) {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings', 'billing'],
    queryFn: () => pricingApi.settings('billing'),
  });

  if (isLoading) return <Loading />;
  if (!settings?.length) return <Empty label="No settings yet — use “Seed defaults”." />;

  return (
    <div className="space-y-3">
      {settings.map((s) => (
        <SettingRow
          key={s.key}
          setting={s}
          onSaved={(m) => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            onSaved(m);
          }}
        />
      ))}
    </div>
  );
}

function SettingRow({
  setting,
  onSaved,
}: {
  setting: { key: string; value: string; label: string; description?: string | null };
  onSaved: (m: string) => void;
}) {
  const [value, setValue] = useState(setting.value);
  const dirty = value !== setting.value;

  const save = useMutation({
    mutationFn: () => pricingApi.updateSetting(setting.key, value),
    onSuccess: () => onSaved(`${setting.label} updated`),
  });

  return (
    <div className={cn(cardCls, 'flex flex-wrap items-center gap-4 p-5')}>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-[#202124]">{setting.label}</p>
        {setting.description && (
          <p className="text-[13px] text-[#5f6368]">{setting.description}</p>
        )}
        <p className="text-[12px] text-[#80868b]">{setting.key}</p>
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={cn(inputCls, 'w-40 text-right')}
        aria-label={setting.label}
      />
      <button
        onClick={() => save.mutate()}
        disabled={!dirty || save.isPending}
        className="rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] cursor-pointer disabled:opacity-40"
      >
        Save
      </button>
    </div>
  );
}

/* ── Shared ─────────────────────────────────────────────────────── */

function Loading() {
  return (
    <div className="flex h-40 items-center justify-center">
      <MaterialIcon name="progress_activity" size={26} className="animate-spin text-[#80868b]" />
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className={cn(cardCls, 'px-6 py-16 text-center')}>
      <MaterialIcon name="sell" size={28} className="text-[#80868b]" />
      <p className="mt-2 text-[15px] text-[#5f6368]">{label}</p>
    </div>
  );
}
