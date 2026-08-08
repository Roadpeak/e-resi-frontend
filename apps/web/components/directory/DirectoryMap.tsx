'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import L from 'leaflet';
import { X, MapPin, ImageOff } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import 'leaflet/dist/leaflet.css';

export interface MappablePlace {
  id: string;
  slug: string;
  name: string;
  heroImageUrl: string | null;
  city: string;
  neighborhood?: string | null;
  priceFrom: number | null;
  currency: string;
  latitude: number | null;
  longitude: number | null;
}

const DEFAULT_CENTER: [number, number] = [-1.2864, 36.8172]; // Nairobi
const DEFAULT_ZOOM = 11;

function priceLabel(p: MappablePlace) {
  if (!p.priceFrom) return 'Ask';
  const m = p.priceFrom / 1_000_000;
  return m >= 1 ? `${Number.isInteger(m) ? m : m.toFixed(1)}M` : `${Math.round(p.priceFrom / 1000)}K`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/**
 * A minimal-contract Leaflet map for the directory pages (developer profile,
 * /map/locations). Deliberately independent of PropertiesMapView, which is
 * bound to the fully-normalized Property type — both new surfaces only ever
 * have this lighter shape available, and forcing it through the heavier
 * normalizer just to reuse one component wasn't worth the coupling.
 */
export function DirectoryMap({ places, className }: { places: MappablePlace[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [selected, setSelected] = useState<MappablePlace | null>(null);

  const located = useMemo(
    () => places.filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'),
    [places],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
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

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    located.forEach((place) => {
      const icon = L.divIcon({
        className: '',
        html: `<span style="
          display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;
          border:2px solid #fff;background:#111112;color:#fff;
          font:600 12px/1 system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.28);
          white-space:nowrap;cursor:pointer;transform:translate(-50%,-50%);"
          >${priceLabel(place)}<span style="opacity:.75;font-weight:500;">${escapeHtml(place.name)}</span></span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      L.marker([place.latitude!, place.longitude!], { icon, title: place.name })
        .on('click', () => setSelected(place))
        .addTo(layer);
    });

    if (located.length > 1) {
      const bounds = L.latLngBounds(located.map((p) => [p.latitude!, p.longitude!] as [number, number]));
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15 });
    } else if (located.length === 1) {
      map.setView([located[0].latitude!, located[0].longitude!], 14);
    }
  }, [located]);

  useEffect(() => {
    if (selected && !located.some((p) => p.id === selected.id)) setSelected(null);
  }, [located, selected]);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#e8eaed] ${className ?? ''}`}>
      <div ref={containerRef} className="h-full w-full" />

      {located.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[500] flex justify-center">
          <span className="rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
            No mapped locations to show
          </span>
        </div>
      )}

      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-[600] sm:left-4 sm:right-auto sm:w-80">
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl">
            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm transition-colors hover:bg-white cursor-pointer"
            >
              <X size={14} />
            </button>
            <Link href={`/${selected.slug}`} className="block">
              <div className="relative h-36 w-full bg-[#f0f0f2]">
                {selected.heroImageUrl ? (
                  <Image src={selected.heroImageUrl} alt={selected.name} fill className="object-cover" sizes="320px" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageOff size={20} className="text-[#c4c4c8]" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="truncate text-[15px] font-semibold text-[#111112]">{selected.name}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-[#6b6b70]">
                  <MapPin size={12} className="shrink-0" />
                  {[selected.neighborhood, selected.city].filter(Boolean).join(', ')}
                </p>
                <p className="mt-2 text-[15px] font-semibold text-[#111112]">
                  {selected.priceFrom ? formatPrice(selected.priceFrom, selected.currency) : 'Price on request'}
                </p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
