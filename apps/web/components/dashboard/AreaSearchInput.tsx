'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { inputBase } from '../onboarding/ui';

export interface PickedArea {
  /** The place itself — estate, suburb, town. */
  name: string;
  city?: string;
  county?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

interface Suggestion extends PickedArea {
  id: string;
  /** Second line of the row: "Nairobi, Nairobi County". */
  context: string;
}

/** Kenya's bounding box (minLon, minLat, maxLon, maxLat). */
const KENYA_BBOX = '33.9,-4.8,41.95,5.1';

/**
 * Photon (komoot) — OpenStreetMap geocoding built for type-ahead, unlike
 * Nominatim, whose usage policy forbids autocomplete. No key, no billing.
 */
async function searchPlaces(q: string, signal: AbortSignal): Promise<Suggestion[]> {
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=15&lang=en&bbox=${KENYA_BBOX}`,
    { signal },
  );
  if (!res.ok) return [];
  const json = await res.json();
  const seen = new Set<string>();
  const out: (Suggestion & { rank: number })[] = [];
  for (const f of json?.features ?? []) {
    const p = f.properties ?? {};
    const [lng, lat] = f.geometry?.coordinates ?? [];
    // The bbox spills into Tanzania, Uganda, Somalia and Ethiopia.
    if (p.countrycode !== 'KE' || !p.name || !Number.isFinite(lat)) continue;
    const city = p.city ?? p.district ?? p.locality;
    const county = p.state ?? p.county;
    const key = `${p.name}|${city ?? ''}|${county ?? ''}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `${p.osm_type}${p.osm_id}`,
      name: p.name,
      city: city && city !== p.name ? city : undefined,
      county,
      country: p.country,
      latitude: lat,
      longitude: lng,
      context: [city !== p.name ? city : null, county].filter(Boolean).join(', '),
      // Suburbs and towns first; a restaurant that shares the name last.
      rank: p.osm_key === 'place' ? 0 : p.osm_key === 'boundary' ? 1 : 2,
    });
  }
  return out.sort((a, b) => a.rank - b.rank).slice(0, 8);
}

/**
 * Free-text input for "Area / neighbourhood" with Kenyan place suggestions.
 * Typing keeps working as a plain field — picking a suggestion additionally
 * hands back the city, county and coordinates for the caller to fill in.
 */
export function AreaSearchInput({
  value,
  onChange,
  onPick,
  placeholder,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: (area: PickedArea) => void;
  placeholder?: string;
  /** Replaces the default input styling, for forms with their own look. */
  inputClassName?: string;
}) {
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  // Set after a pick, so filling the field doesn't immediately search again.
  const skipNext = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await searchPlaces(q, ctrl.signal);
        setResults(found);
        setActive(-1);
        setOpen(true);
      } catch {
        // Aborted or offline — the field still accepts typed text.
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function pick(s: Suggestion) {
    skipNext.current = true;
    setOpen(false);
    onChange(s.name);
    onPick(s);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className={cn(inputClassName ?? inputBase, 'pr-9')}
      />
      {loading && (
        <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
      )}
      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-[14px] text-gray-500">
              No matching places. You can keep what you typed.
            </li>
          ) : (
            results.map((s, i) => (
              <li
                key={s.id}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 px-4 py-2.5',
                  i === active && 'bg-[#F6F9FF]',
                )}
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium text-[#202124]">{s.name}</span>
                  {s.context && <span className="block truncate text-[13px] text-gray-500">{s.context}</span>}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
