'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * The development's position, as a real map rather than an iframe embed.
 *
 * This replaced `openstreetmap.org/export/embed.html`. That embed resolves its
 * tile grid once, against whatever size the iframe happens to have at load,
 * and never recomputes — so any panel that changes height after mount (here,
 * one stretched to match the column beside it) ended up with tiles occupying a
 * corner of a larger box. It is also a shared, rate-limited endpoint: under
 * repeated loads it simply stops returning tiles, and the page then shows a
 * marker and zoom controls floating on empty ground with no error to explain
 * it.
 *
 * Leaflet is already a dependency and already used for the marketplace and
 * directory maps, so this costs no new weight. It renders tiles directly, it
 * reflows on container resize, and a failed tile is a missing square rather
 * than a blank panel.
 */
export function PropertyMiniMap({
  latitude,
  longitude,
  label,
  className,
}: {
  latitude: number;
  longitude: number;
  /** Tooltip on the marker — the development's name. */
  label?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 14,
      // A page-embedded map that grabs the wheel makes the page unscrollable
      // over it. Click to zoom, or use the controls.
      scrollWheelZoom: false,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // A drawn marker rather than Leaflet's default PNG, which 404s unless the
    // icon assets are copied into the public directory.
    const icon = L.divIcon({
      className: '',
      html: `<span style="
        display:block;width:18px;height:18px;border-radius:9999px;
        background:var(--brand,#1a73e8);
        border:3px solid #fff;
        box-shadow:0 1px 6px rgba(0,0,0,0.35);
      "></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const marker = L.marker([latitude, longitude], { icon }).addTo(map);
    if (label) marker.bindTooltip(label, { direction: 'top', offset: [0, -10] });

    // The panel is stretched to match the column beside it, so its final
    // height is not known until layout settles. Leaflet caches the container
    // size at init; without this it would render tiles for the wrong box —
    // the exact fault the iframe embed had and could not recover from.
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, label]);

  return <div ref={containerRef} className={className} aria-label="Map" role="img" />;
}
