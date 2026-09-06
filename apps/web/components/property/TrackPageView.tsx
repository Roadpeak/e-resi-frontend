'use client';

import { useEffect } from 'react';
import { captureReferral } from '../../lib/analytics/referral';
import { track } from '../../lib/analytics/track';

/**
 * Fire-and-forget PAGE_VIEW for a property page.
 *
 * This used to carry its own copy of the emitter, which put the referring
 * agent under metadata instead of the top-level agentId column — so agent
 * link traffic never showed up in the referral report. It now goes through
 * the central track(), the same path every other event uses.
 */
export function TrackPageView({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    if (!propertyId) return;
    // Capture must run before the event fires, or the very first visit
    // through an agent's link — the click that IS the referral — would be
    // the one view that isn't credited.
    captureReferral();
    track({ type: 'PAGE_VIEW', propertyId });
  }, [propertyId]);

  return null;
}
