'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import L from 'leaflet';
import { X, BedDouble, Bath, Maximize2, Star } from 'lucide-react';
import type { Property } from '../../lib/types';
import { formatPrice, cn } from '../../lib/utils';
import 'leaflet/dist/leaflet.css';

interface Props {
  properties: Property[];
  /** Property id to fly to and open the popup for — set by "View on map" on a card. */
  focusPropertyId?: string | null;
}

/** Nairobi — the fallback view when nothing has coordinates yet. */
const DEFAULT_CENTER: [number, number] = [-1.2864, 36.8172];
const DEFAULT_ZOOM = 11;

// Keyed to the backend PropertyStatus enum. These were lowercase before,
// so every marker fell through to the default blue.
/**
 * Marker colours.
 *
 * Deliberately only two: the map previously ran four (green / orange / red /
 * amber), which read as a legend the page never explains and made a screen of
 * pins look noisy. Blue is the default for anything on the market — it is the
 * brand's own accent, so pins sit with the rest of the UI instead of competing
 * with it. Sold-out is the single exception worth calling out, and it is muted
 * rather than red: those pins are context, not warnings.
 */
const MARKER_DEFAULT = '#1a73e8';
const MARKER_SOLD_OUT = '#80868b';

const statusColors: Record<string, string> = {
  ACTIVE: MARKER_DEFAULT,
  OFF_PLAN: MARKER_DEFAULT,
  DRAFT: MARKER_DEFAULT,
  SOLD_OUT: MARKER_SOLD_OUT,
};

/**
 * The marker is built as an HTML string, so a development name containing
 * `<` or `&` would otherwise break the pin — or inject markup.
 */
function escapeHtml(v: string) {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Long names would make a pin wider than a phone screen. */
function shortName(name: string, max = 22) {
  return name.length <= max ? name : `${name.slice(0, max - 1).trimEnd()}…`;
}

function priceLabel(p: Property) {
  if (!p.priceFrom) return 'Ask';
  const m = p.priceFrom / 1_000_000;
  return m >= 1 ? `${Number.isInteger(m) ? m : m.toFixed(1)}M` : `${Math.round(p.priceFrom / 1000)}K`;
}

export function PropertiesMapView({ properties, focusPropertyId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [selected, setSelected] = useState<Property | null>(null);

  // Only properties with real coordinates can be plotted.
  const located = useMemo(
    () =>
      properties.filter(
        (p) =>
          typeof p.address?.coordinates?.lat === 'number' &&
          typeof p.address?.coordinates?.lng === 'number' &&
          p.address.coordinates.lat !== 0 &&
          p.address.coordinates.lng !== 0,
      ),
    [properties],
  );

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      // Let the page keep its scroll; users zoom with the +/- controls.
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // The panel can still be laying out when the map is created; Leaflet needs
    // to be told once it has real dimensions or it renders a single tile.
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Sync markers whenever the result set changes.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersRef.current.clear();

    located.forEach((property) => {
      const color = statusColors[property.status] ?? MARKER_DEFAULT;
      const icon = L.divIcon({
        className: '',
        html: `<span style="
          display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;
          border:2px solid #fff;background:${color};color:#fff;
          font:600 12px/1 system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.28);
          white-space:nowrap;cursor:pointer;transform:translate(-50%,-50%);"
          ><span style="font-weight:600">${escapeHtml(shortName(property.name))}</span
          ><span style="opacity:.55">|</span
          ><span style="font-weight:700">${priceLabel(property)}</span></span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([property.address.coordinates.lat, property.address.coordinates.lng], {
        icon,
        title: property.name,
      })
        .on('click', () => setSelected(property))
        .addTo(layer);

      markersRef.current.set(property.id, marker);
    });

    // Frame the results: fit to all pins, or centre on a lone one.
    if (located.length > 1) {
      const bounds = L.latLngBounds(
        located.map(
          (p) => [p.address.coordinates.lat, p.address.coordinates.lng] as [number, number],
        ),
      );
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15 });
    } else if (located.length === 1) {
      map.setView([located[0].address.coordinates.lat, located[0].address.coordinates.lng], 14);
    }
  }, [located]);

  // Drop the popup if its property leaves the result set.
  useEffect(() => {
    if (selected && !located.some((p) => p.id === selected.id)) setSelected(null);
  }, [located, selected]);

  // "View on map" — scroll this exact pin into view and open its popup.
  useEffect(() => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !el || !focusPropertyId) return;
    const property = located.find((p) => p.id === focusPropertyId);
    if (!property) return;

    // A container with no dimensions is either display:hidden or still
    // laying out. flyTo animates against that pixel size, so running it here
    // threw and took the whole page down with a client-side exception —
    // which is what happened on mobile, where this panel is hidden and the
    // fullscreen overlay had only just been mounted.
    let cancelled = false;
    const focus = () => {
      if (cancelled || !mapRef.current || !containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width < 1 || height < 1) return false;
      // Leaflet caches the container size at creation; without this the
      // fly lands off-centre on a panel that has just appeared.
      mapRef.current.invalidateSize();
      mapRef.current.flyTo(
        [property.address.coordinates.lat, property.address.coordinates.lng],
        15,
        { duration: 0.8 },
      );
      setSelected(property);
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    };

    if (focus() === false) {
      // Not laid out yet — try again on the next frame rather than throwing.
      const raf = requestAnimationFrame(() => { focus(); });
      return () => { cancelled = true; cancelAnimationFrame(raf); };
    }
    return () => { cancelled = true; };
  }, [focusPropertyId, located]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e8eaed]">
      <div ref={containerRef} className="h-full w-full" />

      {located.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[500] flex justify-center">
          <span className="rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
            No mapped locations for these results
          </span>
        </div>
      )}

      {/* Selected popup */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-5 left-5 z-[500] w-64"
          >
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-gray-300/60">
              <div className="relative h-36">
                {selected.heroImageUrl && (
                  <Image
                    src={selected.heroImageUrl}
                    alt={selected.name}
                    fill
                    className="object-cover"
                    sizes="256px"
                  />
                )}
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="absolute right-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm transition-colors hover:text-gray-800"
                >
                  <X size={11} />
                </button>
                <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm">
                  <Star size={11} className="fill-red-400 text-red-400" />
                </div>
              </div>

              <div className="p-3.5">
                <h3 className="text-sm font-semibold leading-tight text-gray-900">{selected.name}</h3>
                <div className="mb-2.5 mt-1.5 flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-gray-900">
                      {formatPrice(selected.priceFrom, selected.currency)}
                    </span>
                    <span className="ml-1 text-xs text-gray-400">from</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <BedDouble size={11} /> {selected.floorPlans[0]?.bedrooms ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath size={11} /> {selected.floorPlans[0]?.bathrooms ?? 1}
                  </span>
                  <span className="flex items-center gap-1">
                    <Maximize2 size={11} /> {selected.floorPlans[0]?.sqm ?? 0}m²
                  </span>
                </div>
                <Link
                  href={`/${selected.slug}`}
                  className={cn(
                    'mt-3 block rounded-xl bg-gray-900 py-2 text-center text-xs font-medium',
                    'text-white transition-colors hover:bg-gray-700',
                  )}
                >
                  View property →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
