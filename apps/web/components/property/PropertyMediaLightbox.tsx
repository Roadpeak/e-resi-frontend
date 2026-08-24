'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * The media lightbox: photos, the street outside, and the neighbourhood.
 *
 * Modelled on the way a listing site groups these — one overlay with tabs
 * rather than three separate features — because a buyer asking "what does it
 * actually look like there?" wants the building, the street and the area in
 * one place, and will not hunt for three different buttons to get them.
 *
 * Street View is Google's panorama in an iframe. It needs no API key in this
 * form, which is why it is worth having: the same view through the Maps
 * JavaScript SDK would mean a billed key on every property page.
 */

export type LightboxTab = 'photos' | 'street' | 'area';

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: LightboxTab;
  propertyName: string;
  /** The development's own photography. */
  photos: { id: string; url: string; title?: string | null }[];
  /** Photographs of the surrounding area, uploaded by the developer. */
  areaPhotos: { id: string; url: string; title?: string | null }[];
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
}

export function PropertyMediaLightbox({
  open, onClose, initialTab = 'photos',
  propertyName, photos, areaPhotos, latitude, longitude, address,
}: Props) {
  const [tab, setTab] = useState<LightboxTab>(initialTab);
  const [index, setIndex] = useState(0);

  const hasStreet = typeof latitude === 'number' && typeof longitude === 'number';
  const hasArea = areaPhotos.length > 0;

  const tabs = [
    photos.length > 0 && { id: 'photos' as const, label: 'Photos', count: photos.length },
    hasStreet && { id: 'street' as const, label: 'Street view' },
    hasArea && { id: 'area' as const, label: 'Neighbourhood', count: areaPhotos.length },
  ].filter(Boolean) as { id: LightboxTab; label: string; count?: number }[];

  // Opening on a tab that is not available would show an empty overlay.
  useEffect(() => {
    if (!open) return;
    setTab(tabs.some((t) => t.id === initialTab) ? initialTab : (tabs[0]?.id ?? 'photos'));
    setIndex(0);
  }, [open, initialTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = tab === 'area' ? areaPhotos : photos;

  const step = useCallback((by: number) => {
    setIndex((i) => (active.length ? (i + by + active.length) % active.length : 0));
  }, [active.length]);

  // Keyboard: a full-screen overlay that ignores Escape traps people.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (tab !== 'street') {
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    // The page behind must not scroll while the overlay is up.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, step, tab]);

  if (!open) return null;

  /**
   * Google's keyless Street View embed.
   *
   * `output=svembed` is the panorama-only view — no search box, no map
   * chrome — and `cbp` sets the initial heading and pitch. Google resolves the
   * nearest captured panorama to these coordinates itself, so a development
   * set back from the road still shows its street.
   */
  const streetUrl = hasStreet
    ? `https://maps.google.com/maps?q=&layer=c&cbll=${latitude},${longitude}&cbp=11,0,0,0,0&output=svembed`
    : null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-white">
      {/* ── Tabs ── */}
      <header className="flex shrink-0 items-center gap-1 border-b border-gray-200 px-3 sm:px-5">
        <button
          onClick={onClose}
          aria-label="Close"
          className="mr-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
        >
          <X size={20} />
        </button>
        <nav className="scrollbar-hide flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setIndex(0); }}
              className={cn(
                'shrink-0 cursor-pointer border-b-2 px-4 py-3.5 text-[15px] font-medium transition-colors',
                tab === t.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900',
              )}
            >
              {t.label}
              {t.count != null && <span className="ml-1.5 text-gray-400">{t.count}</span>}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Body ── */}
      <div className="min-h-0 flex-1 bg-gray-50">
        {tab === 'street' && streetUrl ? (
          <div className="flex h-full flex-col">
            <iframe
              src={streetUrl}
              title={`Street view of ${propertyName}`}
              className="h-full w-full flex-1 border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {address && (
              <p className="flex shrink-0 items-center gap-1.5 border-t border-gray-200 bg-white px-5 py-3 text-[14px] text-gray-500">
                <MapPin size={14} /> {address}
              </p>
            )}
          </div>
        ) : active.length > 0 ? (
          <div className="relative flex h-full items-center justify-center p-4 sm:p-8">
            <div className="relative h-full w-full max-w-5xl">
              <Image
                key={active[index]?.id}
                src={active[index]?.url ?? ''}
                alt={active[index]?.title || propertyName}
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized
              />
            </div>

            {active.length > 1 && (
              <>
                {([['prev', -1, ChevronLeft], ['next', 1, ChevronRight]] as const).map(
                  ([key, by, Icon]) => (
                    <button
                      key={key}
                      onClick={() => step(by)}
                      aria-label={key === 'prev' ? 'Previous photo' : 'Next photo'}
                      className={cn(
                        'absolute top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50',
                        key === 'prev' ? 'left-4' : 'right-4',
                      )}
                    >
                      <Icon size={20} />
                    </button>
                  ),
                )}
                <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[14px] tabular-nums text-gray-500">
                  {index + 1} of {active.length}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-[15px] text-gray-500">Nothing to show here yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
