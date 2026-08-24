'use client';

import { createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { climateFor, rainySeasons } from '../../lib/property/climate';
import { cn } from '../../lib/utils';

/**
 * The sections a listing site puts below the fold: house rules, what the home
 * and the building have, the neighbourhood, and the climate.
 *
 * Deliberately monochrome. These are reference sections a buyer reads rather
 * than scans, and colour here competes with the photography above for the same
 * attention — so type weight and rules do the separating, and nothing sits on
 * a tinted background.
 *
 * Every section renders only when it has content. A heading over an empty
 * panel reads as a broken page, and on a property page it reads as a developer
 * who has not finished listing.
 */

/**
 * Light or dark ground.
 *
 * A context rather than a prop on every part: these sections nest four deep,
 * and threading `tone` through each would be noise in every signature for a
 * value that never changes within one page.
 */
const ToneContext = createContext<'light' | 'dark'>('light');
const useTone = () => useContext(ToneContext);

/** One palette, resolved per ground. */
function palette(tone: 'light' | 'dark') {
  return tone === 'dark'
    ? {
        rule: 'border-white/15',
        heading: 'text-white',
        body: 'text-white/75',
        muted: 'text-white/50',
        faint: 'text-white/35',
        bar: 'bg-white',
        pillOn: 'border-white bg-white text-gray-900',
        pillOff: 'border-white/25 text-white/70 hover:border-white',
      }
    : {
        rule: 'border-gray-200',
        heading: 'text-gray-900',
        body: 'text-gray-700',
        muted: 'text-gray-500',
        faint: 'text-gray-400',
        bar: 'bg-gray-900',
        pillOn: 'border-gray-900 bg-gray-900 text-white',
        pillOff: 'border-gray-300 text-gray-700 hover:border-gray-900',
      };
}

interface Amenity {
  id?: string;
  name: string;
  type?: string;
  distance?: string | null;
}

export interface PropertyInsightsData {
  name: string;
  neighborhood?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** What the development itself has — pool, gym, borehole. */
  features?: string[];
  /** What a home comes with — fitted kitchen, ensuite, balcony. */
  unitFeatures?: string[];
  amenities?: Amenity[];
  petsAllowed?: boolean | null;
  petPolicy?: string | null;
  leaseTerms?: string | null;
  areaDescription?: string | null;
}

/* ── Shared shells ─────────────────────────────────────────────────────── */

function Section({
  id, title, subtitle, children,
}: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  const c = palette(useTone());
  return (
    <section id={id} className={cn('scroll-mt-32 border-t py-10', c.rule)}>
      <h2 className={cn('text-[23px] font-bold leading-[1.25]', c.heading)}>{title}</h2>
      {subtitle && <p className={cn('mt-1 text-[15px]', c.muted)}>{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A collapsible group — the shape Redfin uses for amenities and policies. */
function Group({
  title, count, children, defaultOpen = true,
}: { title: string; count?: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const c = palette(useTone());
  return (
    <div className={cn('border-b last:border-0', c.rule)}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between py-4 text-left"
      >
        <span className={cn('text-[16px] font-semibold', c.heading)}>
          {title}
          {count != null && <span className={cn('ml-2 font-normal', c.faint)}>{count}</span>}
        </span>
        <ChevronDown size={17} className={cn('shrink-0 transition-transform', c.faint, open && 'rotate-180')} />
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

/** Two columns of plain bullets, the way a spec sheet reads. */
function BulletList({ items }: { items: string[] }) {
  const c = palette(useTone());
  return (
    <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className={cn('flex gap-2 text-[15px]', c.body)}>
          <span aria-hidden className={c.faint}>•</span>
          <span className="capitalize">{item.replace(/[-_]/g, ' ')}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Sections ──────────────────────────────────────────────────────────── */

function AmenitiesSection({ features, unitFeatures }: { features: string[]; unitFeatures: string[] }) {
  if (!features.length && !unitFeatures.length) return null;
  return (
    <Section id="amenities" title="Amenities">
      <div className={cn("border-t", palette(useTone()).rule)}>
        {unitFeatures.length > 0 && (
          <Group title="In-unit" count={unitFeatures.length}>
            <BulletList items={unitFeatures} />
          </Group>
        )}
        {features.length > 0 && (
          <Group title="Community" count={features.length}>
            <BulletList items={features} />
          </Group>
        )}
      </div>
    </Section>
  );
}

function PoliciesSection({
  petsAllowed, petPolicy, leaseTerms,
}: { petsAllowed?: boolean | null; petPolicy?: string | null; leaseTerms?: string | null }) {
  const hasPets = petsAllowed != null || !!petPolicy;
  if (!hasPets && !leaseTerms) return null;

  return (
    <Section id="policies" title="Policies">
      <div className={cn("border-t", palette(useTone()).rule)}>
        {hasPets && (
          <Group title="Pets">
            <p className={cn("text-[15px]", palette(useTone()).body)}>
              {petsAllowed === false
                ? 'Pets are not permitted.'
                : petsAllowed === true
                  ? 'Pets are welcome.'
                  : 'Ask the developer about pets.'}
            </p>
            {petPolicy && <p className={cn("mt-2 text-[15px] leading-relaxed", palette(useTone()).muted)}>{petPolicy}</p>}
          </Group>
        )}
        {leaseTerms && (
          <Group title="Lease terms">
            <p className={cn("text-[15px] leading-relaxed", palette(useTone()).muted)}>{leaseTerms}</p>
          </Group>
        )}
      </div>
    </Section>
  );
}

function AroundSection({ name, amenities }: { name: string; amenities: Amenity[] }) {
  if (!amenities.length) return null;

  // Grouped by kind, so "three schools within 2 km" is readable at a glance
  // rather than something the reader has to assemble from a flat list.
  const groups = amenities.reduce<Record<string, Amenity[]>>((acc, a) => {
    const key = (a.type ?? 'NEARBY').toLowerCase();
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  const label = (k: string) => k.charAt(0).toUpperCase() + k.slice(1).toLowerCase() + (k.endsWith('s') ? '' : 's');

  return (
    <Section id="around" title={`Around ${name}`} subtitle="What is within reach of the development.">
      <div className={cn("border-t", palette(useTone()).rule)}>
        {Object.entries(groups).map(([kind, list]) => (
          <Group key={kind} title={label(kind)} count={list.length} defaultOpen={false}>
            <ul className="space-y-2">
              {list.map((a) => (
                <li key={a.id ?? a.name} className="flex items-baseline justify-between gap-4 text-[15px]">
                  <span className={palette(useTone()).body}>{a.name}</span>
                  {a.distance && <span className={cn("shrink-0", palette(useTone()).muted)}>{a.distance}</span>}
                </li>
              ))}
            </ul>
          </Group>
        ))}
      </div>
    </Section>
  );
}

function AreaSection({ area, neighborhood, city }: { area?: string | null; neighborhood?: string | null; city?: string | null }) {
  if (!area) return null;
  const place = [neighborhood, city].filter(Boolean).join(', ');
  return (
    <Section id="area" title={place ? `About ${place}` : 'About the area'}>
      <p className={cn("max-w-3xl whitespace-pre-line text-[16px] leading-relaxed", palette(useTone()).body)}>{area}</p>
    </Section>
  );
}

function WeatherSection({ lat, lng, city }: { lat?: number | null; lng?: number | null; city?: string | null }) {
  const climate = climateFor(lat, lng);
  const [metric, setMetric] = useState<'temp' | 'rain'>('temp');
  const c = palette(useTone());
  if (!climate) return null;

  const { months } = climate;

  /**
   * Temperature bars are measured from just below the coldest night, not from
   * zero.
   *
   * Kenya's highs sit between 21°C and 26°C, so a zero-based axis draws twelve
   * bars of near-identical height and hides the very variation the chart
   * exists to show. Rainfall does start at zero, because a dry month really is
   * nothing and shortening that bar would misrepresent it.
   */
  const values = months.map((m) => (metric === 'temp' ? m.high : m.rain));
  const peak = Math.max(...values);
  const floor = metric === 'temp'
    ? Math.min(...months.map((m) => m.low)) - 2
    : 0;
  const span = Math.max(1, peak - floor);

  return (
    <Section
      id="weather"
      title="Historical weather"
      subtitle={[city, climate.zone].filter(Boolean).join(' · ')}
    >
      <div className="mb-6 flex gap-2">
        {([['temp', 'Temperature'], ['rain', 'Rainfall']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMetric(key)}
            className={cn(
              'cursor-pointer rounded-full border px-4 py-1.5 text-[14px] font-medium transition-colors',
              metric === key ? c.pillOn : c.pillOff,
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className={cn("mb-4 text-[15px]", c.muted)}>
        {metric === 'temp'
          ? 'Average daily high and low (°C)'
          : `Average monthly rainfall (mm) — ${rainySeasons(months)}`}
      </p>

      {/* Bars in ink, labelled with their own numbers: a chart a buyer reads
          once does not need a legend or a colour key. */}
      <div className="flex items-end gap-1.5 overflow-x-auto sm:gap-2">
        {months.map((m) => {
          const value = metric === 'temp' ? m.high : m.rain;
          const height = Math.max(6, Math.round(((value - floor) / span) * 130));
          return (
            <div key={m.month} className="flex min-w-[34px] flex-1 flex-col items-center gap-1.5">
              <span className={cn('text-[12px] font-semibold tabular-nums', c.heading)}>{value}</span>
              <div className={cn('w-full rounded-sm', c.bar)} style={{ height }} />
              {metric === 'temp' && (
                <span className={cn('text-[12px] tabular-nums', c.faint)}>{m.low}</span>
              )}
              <span className={cn('text-[12px]', c.muted)}>{m.month}</span>
            </div>
          );
        })}
      </div>

      <p className={cn('mt-5 text-[13px]', c.faint)}>
        Long-run monthly norms for this climate zone.
      </p>
    </Section>
  );
}

function SunSection({ lat, lng }: { lat?: number | null; lng?: number | null }) {
  const climate = climateFor(lat, lng);
  const c = palette(useTone());
  if (!climate) return null;

  const { longest, shortest, annual } = climate.sun;
  const swing = longest - shortest;
  const hrs = (n: number) => `${Math.floor(n)}h ${Math.round((n % 1) * 60)}m`;

  return (
    <Section id="sun" title="Sun exposure">
      <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
        <p className={cn("max-w-xl text-[16px] leading-relaxed", c.body)}>
          Daylight here runs about {hrs(annual)} a day and varies by only{' '}
          {Math.round(swing * 60)} minutes across the year — close to the equator, so
          sunrise and sunset barely move between seasons. Rooms facing the same way get
          consistent light in January and July alike.
        </p>

        <div className="flex gap-8">
          {[['Longest day', longest], ['Shortest day', shortest]].map(([label, value]) => (
            <div key={label as string}>
              <p className={cn('text-[23px] font-bold leading-[1.25] tabular-nums', c.heading)}>
                {hrs(value as number)}
              </p>
              <p className={cn('text-[14px]', c.muted)}>{label as string}</p>
            </div>
          ))}
        </div>
      </div>
      <p className={cn('mt-5 text-[13px]', c.faint)}>
        Calculated from the development&apos;s latitude.
      </p>
    </Section>
  );
}

/* ── The set ───────────────────────────────────────────────────────────── */

export function PropertyInsights({
  property,
  tone = 'light',
}: {
  property: PropertyInsightsData;
  /** LuxeDark renders on near-black, where ink-on-white is unreadable. */
  tone?: 'light' | 'dark';
}) {
  const features = property.features ?? [];
  const unitFeatures = property.unitFeatures ?? [];
  const amenities = property.amenities ?? [];

  return (
    <ToneContext.Provider value={tone}>
    <div className="mx-auto max-w-5xl">
      <AmenitiesSection features={features} unitFeatures={unitFeatures} />
      <PoliciesSection
        petsAllowed={property.petsAllowed}
        petPolicy={property.petPolicy}
        leaseTerms={property.leaseTerms}
      />
      <AreaSection
        area={property.areaDescription}
        neighborhood={property.neighborhood}
        city={property.city}
      />
      <AroundSection name={property.name} amenities={amenities} />
      <WeatherSection lat={property.latitude} lng={property.longitude} city={property.city} />
      <SunSection lat={property.latitude} lng={property.longitude} />
    </div>
    </ToneContext.Provider>
  );
}
