'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, Plus, Search, Trash2 } from 'lucide-react';
import { propertiesApi } from '../../lib/api/properties';
import { ApiError } from '../../lib/api/client';
import { cn } from '../../lib/utils';

/**
 * The "Nearby" landmarks on a published development.
 *
 * The creation wizard has always been able to find these from OpenStreetMap,
 * but only at creation — a developer who skipped the step, or who moved the
 * pin afterwards, had no way back to it. This is the same detection on the
 * property's own page, so the list can be built or refreshed at any time.
 *
 * Detection suggests rather than saves: OSM returns the occasional junk entry,
 * and a developer publishing "Nairobi Bureau De Change" as a headline amenity
 * because we ticked it for them is worse than them adding nothing.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';
const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-3 py-2 text-[14px] text-[#202124] placeholder-[#80868b] focus:border-[#1a73e8] focus:outline-none';

/** Backend AmenityType values, with the labels developers actually use. */
const NEARBY_TYPES: { value: string; label: string }[] = [
  { value: 'SCHOOL', label: 'School' },
  { value: 'HOSPITAL', label: 'Hospital / clinic' },
  { value: 'MALL', label: 'Mall / shopping' },
  { value: 'SUPERMARKET', label: 'Supermarket' },
  { value: 'TRANSPORT', label: 'Transport / bus stop' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'PARK', label: 'Park / green space' },
  { value: 'BANK', label: 'Bank / ATM' },
  { value: 'GYM', label: 'Gym' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'AIRPORT', label: 'Airport' },
];

interface Place {
  name: string;
  type: string;
  distance?: string | null;
}

interface Suggestion {
  name: string;
  type: string;
  distance: string;
  distanceMetres: number;
}

export function NearbyPlacesManager({
  slug,
  latitude,
  longitude,
  amenities,
}: {
  slug: string;
  latitude?: number | null;
  longitude?: number | null;
  amenities: Place[];
}) {
  const queryClient = useQueryClient();
  const [places, setPlaces] = useState<Place[]>(amenities);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // The list is fetched with the property, so a save elsewhere on the page
  // must not leave this editing a stale copy.
  useEffect(() => { setPlaces(amenities); }, [amenities]);

  const hasPoint = typeof latitude === 'number' && typeof longitude === 'number';

  async function findNearby() {
    if (!hasPoint) return;
    setError('');
    setFinding(true);
    setSuggestions(null);
    try {
      const found = await propertiesApi.nearbySuggestions(latitude!, longitude!, 3000);
      // Anything already listed is not offered again.
      const existing = new Set(places.map((p) => p.name.trim().toLowerCase()));
      const fresh = found.filter((s) => !existing.has(s.name.toLowerCase()));
      setSuggestions(fresh);
      // The closest few are pre-ticked; the rest are opt-in, because OSM
      // returns the occasional junk entry and a developer should not have to
      // un-publish something we chose for them.
      setPicked(new Set(fresh.slice(0, 6).map((s) => s.name)));
      if (!fresh.length) setError('No new places found around this point.');
    } catch {
      setError('Could not fetch suggestions. Add places by hand below.');
    } finally {
      setFinding(false);
    }
  }

  const save = useMutation({
    mutationFn: () =>
      propertiesApi.setAmenities(
        slug,
        places
          .filter((p) => p.name.trim())
          .map((p) => ({ name: p.name.trim(), type: p.type, distance: p.distance || undefined })),
      ),
    onSuccess: () => {
      setSaved(true);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['dash-property', slug] });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e) =>
      setError(e instanceof ApiError || e instanceof Error ? e.message : 'Could not save.'),
  });

  const addPicked = () => {
    if (!suggestions) return;
    setPlaces([
      ...places,
      ...suggestions
        .filter((s) => picked.has(s.name))
        .map((s) => ({ name: s.name, type: s.type, distance: s.distance })),
    ]);
    setSuggestions(null);
    setPicked(new Set());
  };

  const update = (i: number, patch: Partial<Place>) =>
    setPlaces(places.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <div className={cn(card, 'p-6')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-normal text-[#202124]">Nearby places</h2>
          <p className="mt-0.5 max-w-2xl text-[13px] text-[#5f6368]">
            Landmarks around the development that it does not own — schools, hospitals, malls,
            transport. Shown on your property page under &ldquo;Around&rdquo; with their distance.
          </p>
        </div>
        <button
          onClick={findNearby}
          disabled={!hasPoint || finding}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] disabled:opacity-40 cursor-pointer"
        >
          {finding ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {finding ? 'Searching…' : 'Find nearby places'}
        </button>
      </div>

      {!hasPoint && (
        <p className="mt-4 rounded-2xl bg-[#fef7e0] px-4 py-3 text-[13px] text-[#b06000]">
          Set the development&apos;s coordinates above first — detection searches outward from that
          point.
        </p>
      )}

      {/* ── Suggestions ── */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-5 rounded-2xl border border-[#dadce0] bg-[#f8f9fa] p-4">
          <p className="text-[14px] font-medium text-[#202124]">
            Found {suggestions.length} nearby — tick what belongs on your listing
          </p>
          <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
            {suggestions.map((s) => (
              <label
                key={s.name}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={picked.has(s.name)}
                  onChange={(e) => {
                    const next = new Set(picked);
                    if (e.target.checked) next.add(s.name); else next.delete(s.name);
                    setPicked(next);
                  }}
                  className="h-4 w-4 cursor-pointer accent-[#1a73e8]"
                />
                <span className="min-w-0 flex-1 truncate text-[14px] text-[#202124]">{s.name}</span>
                <span className="shrink-0 text-[12px] uppercase tracking-wide text-[#80868b]">
                  {s.type.toLowerCase()}
                </span>
                <span className="shrink-0 text-[13px] text-[#5f6368]">{s.distance}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={addPicked}
              disabled={picked.size === 0}
              className="rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40 cursor-pointer"
            >
              Add {picked.size} selected
            </button>
            <button
              onClick={() => { setSuggestions(null); setPicked(new Set()); }}
              className="rounded-full px-4 py-2 text-[14px] font-medium text-[#5f6368] transition-colors hover:bg-[#f1f3f4] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-sm text-[#c5221f]">{error}</p>}

      {/* ── The list ── */}
      {places.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-[#f8f9fa] px-4 py-3 text-[13px] text-[#5f6368]">
          None listed yet. Detection is the quickest way to start.
        </p>
      ) : (
        <div className="mt-5 space-y-2">
          {places.map((p, i) => (
            <div key={`${p.name}-${i}`} className="grid gap-2 sm:grid-cols-[1fr_180px_120px_auto]">
              <input
                value={p.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Sarit Centre"
                className={inputCls}
              />
              <select
                value={p.type}
                onChange={(e) => update(i, { type: e.target.value })}
                className={inputCls}
              >
                {NEARBY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                value={p.distance ?? ''}
                onChange={(e) => update(i, { distance: e.target.value })}
                placeholder="1.2 km"
                className={inputCls}
              />
              <button
                onClick={() => setPlaces(places.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${p.name || 'place'}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#80868b] transition-colors hover:bg-[#fce8e6] hover:text-[#c5221f] cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setPlaces([...places, { name: '', type: 'SCHOOL', distance: '' }])}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#5f6368] transition-colors hover:bg-[#f8f9fa] cursor-pointer"
        >
          <Plus size={14} /> Add by hand
        </button>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40 cursor-pointer"
        >
          {save.isPending && <Loader2 size={14} className="animate-spin" />} Save nearby places
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#188038]">
            <MapPin size={13} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
