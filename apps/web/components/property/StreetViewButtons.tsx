'use client';

import { useState } from 'react';
import { Navigation, Trees } from 'lucide-react';
import { PropertyMediaLightbox, type LightboxTab } from './PropertyMediaLightbox';
import { cn } from '../../lib/utils';

/**
 * The Street view and Neighbourhood entry points, plus the overlay they open.
 *
 * Separate from the gallery components because each template draws its own
 * gallery — Kit, LuxeDark and the classic page all differ — and duplicating
 * the buttons and the overlay in three places would guarantee they drift.
 * Templates render this next to their gallery heading and inherit both.
 */
export function StreetViewButtons({
  propertyName,
  photos,
  areaPhotos = [],
  latitude,
  longitude,
  address,
  tone = 'light',
  className,
}: {
  propertyName: string;
  photos: string[];
  areaPhotos?: { id: string; url: string; title?: string | null }[];
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  /** Dark templates render the buttons in white. */
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const [overlay, setOverlay] = useState<LightboxTab | null>(null);
  const hasStreet = typeof latitude === 'number' && typeof longitude === 'number';

  // Nothing to offer — no coordinates and no area photography.
  if (!hasStreet && !areaPhotos.length) return null;

  const button = tone === 'dark'
    ? 'border-white/25 text-white/80 hover:border-white hover:text-white'
    : 'border-gray-300 text-gray-700 hover:border-gray-900';

  return (
    <>
      <div className={cn('flex flex-wrap gap-2', className)}>
        {hasStreet && (
          <button
            onClick={() => setOverlay('street')}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors',
              button,
            )}
          >
            <Navigation size={14} /> Street view
          </button>
        )}
        {areaPhotos.length > 0 && (
          <button
            onClick={() => setOverlay('area')}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors',
              button,
            )}
          >
            <Trees size={14} /> Neighbourhood
          </button>
        )}
      </div>

      <PropertyMediaLightbox
        open={overlay !== null}
        onClose={() => setOverlay(null)}
        initialTab={overlay ?? 'photos'}
        propertyName={propertyName}
        photos={photos.map((url, i) => ({ id: `${i}`, url }))}
        areaPhotos={areaPhotos}
        latitude={latitude}
        longitude={longitude}
        address={address}
      />
    </>
  );
}
