'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import {
  pricingApi,
  PROPERTY_TYPES,
  type PricingTier,
  type PropertyTypeKey,
  type ServiceItem,
  type ServiceItemForType,
} from '../../../../lib/api/admin';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white';
const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2 text-[15px] text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';

type Tab = 'tiers' | 'services' | 'by-type' | 'fee';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'tiers', label: 'Production tiers', icon: 'layers' },
  { key: 'services', label: 'Service catalogue', icon: 'inventory_2' },
  { key: 'by-type', label: 'Pricing by type', icon: 'home_work' },
  { key: 'fee', label: 'Listing fee', icon: 'receipt_long' },
];

const PROPERTY_TYPE_LABELS: Record<PropertyTypeKey, string> = {
  APARTMENT: 'Apartments',
  VILLA: 'Villas',
  TOWNHOUSE: 'Townhouses',
  PENTHOUSE: 'Penthouses',
  OFFICE: 'Offices',
  COMMERCIAL: 'Commercial',
  LAND: 'Land',
};

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
      {tab === 'by-type' && <PricingByTypeTab onSaved={flash} />}
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

/* ── Pricing by property type ───────────────────────────────────── */

/**
 * Production costs differ by what is being shot — a villa is not priced like a
 * one-bed apartment. Each service can carry a price per property type; leaving
 * one blank falls back to the catalogue default, which is why the default is
 * always shown as the input's placeholder.
 */
function PricingByTypeTab({ onSaved }: { onSaved: (m: string) => void }) {
  const [propertyType, setPropertyType] = useState<PropertyTypeKey>('APARTMENT');
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services-by-type', propertyType],
    queryFn: () => pricingApi.servicesByType(propertyType),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {PROPERTY_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setPropertyType(t)}
            className={cn(
              'rounded-full px-4 py-2 text-[14px] font-medium transition-colors cursor-pointer',
              propertyType === t
                ? 'bg-[#1a73e8] text-white'
                : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]',
            )}
          >
            {PROPERTY_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-[#5f6368]">
        Prices for <strong className="font-medium text-[#202124]">{PROPERTY_TYPE_LABELS[propertyType]}</strong>.
        Leave a field blank to use the catalogue default.
      </p>

      {isLoading ? (
        <Loading />
      ) : !services?.length ? (
        <Empty label="No services yet — use “Seed defaults”." />
      ) : (
        <div className="space-y-2">
          {services.map((s) => (
            <TypePriceRow
              key={s.id}
              service={s}
              propertyType={propertyType}
              onSaved={(m) => {
                queryClient.invalidateQueries({ queryKey: ['admin-services-by-type'] });
                onSaved(m);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TypePriceRow({
  service,
  propertyType,
  onSaved,
}: {
  service: ServiceItemForType;
  propertyType: PropertyTypeKey;
  onSaved: (m: string) => void;
}) {
  // Empty means "no override" — deliberately distinct from 0, which is a
  // legitimate price (a service bundled free with a type).
  const [price, setPrice] = useState(service.isTypePriced ? String(service.price) : '');
  const initial = service.isTypePriced ? String(service.price) : '';
  const dirty = price !== initial;

  const save = useMutation({
    mutationFn: () =>
      pricingApi.setServiceTypePrice(
        service.id,
        propertyType,
        price.trim() === '' ? null : Number(price),
      ),
    onSuccess: () =>
      onSaved(
        price.trim() === ''
          ? `${service.label} reset to default for ${PROPERTY_TYPE_LABELS[propertyType]}`
          : `${service.label} priced for ${PROPERTY_TYPE_LABELS[propertyType]}`,
      ),
  });

  return (
    <div className={cn(cardCls, 'flex flex-wrap items-center gap-4 p-4', !service.isActive && 'opacity-60')}>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-[#202124]">
          {service.label}
          {service.isTypePriced ? (
            <span className="ml-2 rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] text-[#1a73e8]">
              custom
            </span>
          ) : (
            <span className="ml-2 rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[11px] text-[#5f6368]">
              default
            </span>
          )}
          {!service.isActive && (
            <span className="ml-2 rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[11px] text-[#5f6368]">
              retired
            </span>
          )}
        </p>
        <p className="text-[13px] text-[#5f6368]">
          Default {service.currency} {service.defaultPrice.toLocaleString()}
        </p>
      </div>
      <span className="text-[13px] text-[#80868b]">{service.currency}</span>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))}
        inputMode="numeric"
        placeholder={String(service.defaultPrice)}
        className={cn(inputCls, 'w-36 text-right')}
        aria-label={`${service.label} price for ${PROPERTY_TYPE_LABELS[propertyType]}`}
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
      <CurrencyCard
        current={settings.find((s) => s.key === 'platform_currency')?.value ?? 'KES'}
        onSaved={(m) => {
          queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
          queryClient.invalidateQueries({ queryKey: ['admin-tiers'] });
          queryClient.invalidateQueries({ queryKey: ['admin-services'] });
          onSaved(m);
        }}
      />
      {/* platform_currency has its own card — editing it as free text would
          relabel prices without converting them. */}
      {settings.filter((s) => s.key !== 'platform_currency').map((s) => (
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

const CURRENCIES = ['KES', 'USD', 'NGN', 'GHS', 'ZAR', 'EUR', 'GBP'];

/**
 * Changing the billing currency is two decisions, not one: which currency, and
 * whether the existing numbers are converted or merely relabelled. Relabelling
 * $850 as KES 850 is a 99% price cut, so the choice is made explicit.
 */
function CurrencyCard({ current, onSaved }: { current: string; onSaved: (m: string) => void }) {
  const [currency, setCurrency] = useState(current);
  const [mode, setMode] = useState<'live' | 'manual' | 'relabel'>('live');
  const [rate, setRate] = useState('');
  const [error, setError] = useState('');

  const changed = currency !== current;

  // Fetched for display so the operator sees the figure before committing, and
  // again server-side at the moment of conversion so a page left open for an
  // hour cannot apply an hour-old rate.
  const { data: live, isFetching: rateLoading, refetch } = useQuery({
    queryKey: ['fx-rate', current, currency],
    queryFn: () => pricingApi.exchangeRate(current, currency),
    enabled: changed,
    staleTime: 60_000,
  });

  const numericRate = Number(rate);
  const rateValid = mode !== 'manual' || (Number.isFinite(numericRate) && numericRate > 0);

  const save = useMutation({
    mutationFn: () => pricingApi.setCurrency(
      currency,
      mode === 'relabel' ? 1 : mode === 'manual' ? numericRate : undefined,
      mode === 'live',
    ),
    onSuccess: (r) => {
      setError('');
      onSaved(
        `Platform currency is now ${r.currency}`
        + (r.pricesConverted > 0
          ? ` — ${r.pricesConverted} price${r.pricesConverted === 1 ? '' : 's'} converted at `
            + `${r.rate}${r.rateSource !== 'manual' ? ` (${r.rateSource})` : ''}`
          : ' — prices relabelled, figures unchanged'),
      );
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not change the currency'),
  });

  return (
    <div className={cn(cardCls, 'p-5')}>
      <p className="text-[15px] font-medium text-[#202124]">Platform currency</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[#5f6368]">
        What the platform bills in — listing fees, production, invoices and receipts.
        It must be a currency your payment gateway settles. Developers price their own
        listings separately.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-[#5f6368]">Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-xl border border-[#dadce0] px-3 py-2 text-[14px] text-[#202124]"
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        {changed && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] text-[#5f6368]">Existing prices</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'live' | 'manual' | 'relabel')}
                className="rounded-xl border border-[#dadce0] px-3 py-2 text-[14px] text-[#202124]"
              >
                <option value="live">Convert at today&apos;s rate</option>
                <option value="manual">Convert at my own rate</option>
                <option value="relabel">Relabel — keep the numbers</option>
              </select>
            </label>

            {mode === 'manual' && (
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[#5f6368]">1 {current} =</span>
                <input
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  inputMode="decimal"
                  placeholder={live ? String(live.rate) : ''}
                  className="w-28 rounded-xl border border-[#dadce0] px-3 py-2 text-[14px] text-[#202124]"
                />
              </label>
            )}

            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending || !rateValid || (mode === 'live' && !live)}
              className="rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50"
            >
              {save.isPending ? 'Applying…' : `Switch to ${currency}`}
            </button>
          </>
        )}
      </div>

      {changed && mode === 'live' && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[#5f6368]">
          {rateLoading ? (
            <span>Checking today&apos;s rate…</span>
          ) : live ? (
            <>
              <span className="text-[#202124]">
                1 {live.from} = {live.rate.toLocaleString()} {live.to}
              </span>
              <span>· {live.source} ·{' '}
                {new Date(live.fetchedAt).toLocaleString(undefined, {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-[#1a73e8] hover:underline"
              >
                Refresh
              </button>
              {live.stale && (
                <span className="rounded-full bg-[#fef7e0] px-2 py-0.5 text-[12px] text-[#b06000]">
                  Rate is over 48h old
                </span>
              )}
            </>
          ) : (
            <span className="text-[#b06000]">
              Live rate unavailable — switch to &ldquo;my own rate&rdquo; to continue.
            </span>
          )}
          <span className="w-full text-[12px]">
            The rate is fetched again when you apply, so this cannot convert at a
            figure that has since moved.
          </span>
        </p>
      )}

      {changed && mode === 'relabel' && (
        <p className="mt-3 rounded-xl bg-[#fef7e0] px-3 py-2 text-[13px] text-[#b06000]">
          Relabelling keeps every figure as-is, so a price of 850 becomes 850 {currency}.
          Only do this if the current numbers were placeholders.
        </p>
      )}
      {changed && (
        <p className="mt-3 text-[12px] text-[#5f6368]">
          Prices already in {currency} are left alone. Invoices and orders already
          raised keep the amount that was agreed.
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl bg-[#fce8e6] px-3 py-2 text-[13px] text-[#c5221f]">{error}</p>
      )}
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
