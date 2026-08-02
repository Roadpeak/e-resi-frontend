'use client';

import { useState } from 'react';
import { Crosshair, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  /** Suburb / estate / ward — the finest-grained name available. */
  neighborhood?: string;
  city?: string;
  county?: string;
  country?: string;
}

/** Nominatim's address keys, coarsest last — first match wins. */
const NEIGHBORHOOD_KEYS = ['neighbourhood', 'suburb', 'quarter', 'residential', 'city_district'];
const CITY_KEYS = ['city', 'town', 'municipality', 'village', 'county'];

async function reverseGeocode(lat: number, lng: number): Promise<Partial<DetectedLocation>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return {};
    const json = await res.json();
    const a = json?.address ?? {};
    return {
      neighborhood: NEIGHBORHOOD_KEYS.map((k) => a[k]).find(Boolean),
      city: CITY_KEYS.map((k) => a[k]).find(Boolean),
      county: a.county ?? a.state,
      country: a.country,
    };
  } catch {
    // Coordinates alone are still useful — the map only needs those.
    return {};
  }
}

/**
 * Fills the address fields from the device's current position.
 * Coordinates come from the browser; the place names come from OpenStreetMap's
 * Nominatim (no key, same data source as the map).
 */
export function DetectLocationButton({
  onDetected,
  className,
  label = 'Use my current location',
}: {
  onDetected: (location: DetectedLocation) => void;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function detect() {
    setError('');

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('This browser cannot detect your location.');
      return;
    }

    // Chrome only exposes geolocation on secure origins. Over plain http on a
    // non-localhost host the call is blocked by policy and still reports
    // PERMISSION_DENIED, which reads as "you denied it" even when you allowed it.
    if (!window.isSecureContext) {
      setError(
        'Location needs a secure connection (https, or localhost). Open the dashboard on localhost or over https, or type the address manually.',
      );
      return;
    }

    // Blocked by Permissions-Policy rather than by the user.
    const policy = (document as Document & {
      featurePolicy?: { allowsFeature(f: string): boolean };
    }).featurePolicy;
    if (policy && typeof policy.allowsFeature === 'function' && !policy.allowsFeature('geolocation')) {
      setError('Location is blocked for this page by a browser permissions policy.');
      return;
    }

    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const place = await reverseGeocode(latitude, longitude);
        onDetected({ latitude, longitude, ...place });
        setBusy(false);
      },
      (err) => {
        setBusy(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location was blocked. Check the padlock/location icon in the address bar and allow it for this site, then try again.'
            : err.code === err.TIMEOUT
              ? 'Timed out finding your location. Try again.'
              : 'Could not determine your location.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={detect}
        disabled={busy}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white',
          'px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors',
          'hover:bg-[#f8fbff] cursor-pointer disabled:opacity-60',
        )}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
        {busy ? 'Detecting…' : label}
      </button>
      {error && <p className="mt-2 text-[13px] text-[#c5221f]">{error}</p>}
    </div>
  );
}
