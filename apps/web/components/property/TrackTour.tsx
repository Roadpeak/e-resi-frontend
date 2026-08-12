'use client';

import { useEffect, useRef } from 'react';
import { track } from '../../lib/analytics/track';

interface Props {
  propertyId: string;
  /** Which tour was opened — 'CINEMATIC' | '3D' | 'VR'. */
  tour: string;
  /**
   * Seconds of dwell before the visit counts as real engagement rather than a
   * bounce. A developer's headline number should mean "watched the tour", not
   * "opened it and left", so TOUR_COMPLETE is gated on this.
   */
  completeAfterSeconds?: number;
}

/**
 * Fires TOUR_START on mount and TOUR_COMPLETE on leave, carrying dwell time.
 *
 * Dwell is the number that matters commercially: "4,200 opened it, 380 spent
 * over two minutes inside" is what justifies a recurring fee, where a raw
 * open count does not. TOUR_COMPLETE is emitted via sendBeacon on unload so
 * it survives the page being torn down.
 */
export function TrackTour({ propertyId, tour, completeAfterSeconds = 30 }: Props) {
  // Refs, not state: these must not trigger re-renders inside a 3D/VR viewer.
  const startedAt = useRef<number>(0);
  const sent = useRef(false);

  useEffect(() => {
    if (!propertyId) return;

    startedAt.current = Date.now();
    sent.current = false;
    track({ type: 'TOUR_START', propertyId, metadata: { tour } });

    const finish = (reason: string) => {
      if (sent.current) return;
      const seconds = Math.round((Date.now() - startedAt.current) / 1000);
      // Below the threshold this was a bounce, not a viewing — recording it
      // as a completion would overstate engagement to the developer.
      if (seconds < completeAfterSeconds) return;
      sent.current = true;
      track({
        type: 'TOUR_COMPLETE',
        propertyId,
        metadata: { tour, seconds, reason },
      });
    };

    // visibilitychange is the reliable signal on mobile, where pagehide and
    // beforeunload are unreliable and often never fire at all.
    const onHidden = () => {
      if (document.visibilityState === 'hidden') finish('hidden');
    };
    const onPageHide = () => finish('pagehide');

    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', onPageHide);
      // Client-side navigation away from the tour: unmount is the only signal.
      finish('unmount');
    };
  }, [propertyId, tour, completeAfterSeconds]);

  return null;
}
