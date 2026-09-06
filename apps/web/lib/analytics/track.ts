/**
 * Client-side analytics emitter.
 *
 * The schema has defined TOUR_START, TOUR_COMPLETE, UNIT_VIEWED, SHARE and
 * INQUIRY_SUBMITTED since the beginning, but only PAGE_VIEW was ever fired —
 * so a developer could be told how many people opened the page and nothing
 * about whether anyone actually watched the tour they paid for. That
 * engagement data is the thing that makes the mini-site defensible, so these
 * events matter more than the page view does.
 *
 * Everything here is fire-and-forget: analytics must never block a tour from
 * starting, and a failed beacon is not worth surfacing to a visitor.
 */

import { getReferral } from './referral';
import { useAuthStore } from '../stores/auth.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'TOUR_START'
  | 'TOUR_COMPLETE'
  | 'INQUIRY_SUBMITTED'
  | 'BOOKING_SUBMITTED'
  | 'UNIT_VIEWED'
  | 'PROPERTY_SAVED'
  | 'SHARE';

/**
 * A per-tab id, so repeat events from one visitor collapse into one session
 * rather than inflating the numbers a developer is shown.
 */
export function sessionId(): string {
  try {
    let id = sessionStorage.getItem('e-resi-session');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('e-resi-session', id);
    }
    return id;
  } catch {
    // Private browsing can throw on sessionStorage access.
    return 'anonymous';
  }
}

/**
 * Coarse traffic source. Deliberately bucketed rather than storing the raw
 * referrer: what a developer needs to know is whether their own shared links
 * or our marketplace drove the visit, not which exact URL.
 */
export function sourceFromReferrer(): string {
  try {
    if (!document.referrer) return 'Direct';
    const host = new URL(document.referrer).hostname;
    if (host === window.location.hostname) return 'Marketplace';
    if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(host)) return 'Search';
    if (/wa\.me|whatsapp\./.test(host)) return 'WhatsApp';
    if (/facebook\.|instagram\.|twitter\.|x\.com|tiktok\.|linkedin\.|youtube\./.test(host)) {
      return 'Social';
    }
    return 'Referral';
  } catch {
    return 'Direct';
  }
}

/**
 * The signed-in visitor's id, surviving the store's slow start.
 *
 * On a fresh page load the user record arrives only after /me resolves, but
 * PAGE_VIEW fires on mount — reading user?.id alone loses exactly the event
 * the viewer-interest report cares most about. The persisted access token is
 * available immediately, so fall back to its sub claim.
 */
function currentUserId(): string | undefined {
  const state = useAuthStore.getState();
  if (state.user?.id) return state.user.id;
  const token = state.accessToken;
  if (!token) return undefined;
  try {
    return (JSON.parse(atob(token.split('.')[1])) as { sub?: string }).sub;
  } catch {
    return undefined;
  }
}

export interface TrackInput {
  type: AnalyticsEventType;
  propertyId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Emit one event. Uses sendBeacon when available so an event fired as the
 * visitor leaves — TOUR_COMPLETE especially — still arrives after the page
 * has been torn down.
 */
export function track({ type, propertyId, metadata }: TrackInput): void {
  if (typeof window === 'undefined' || !propertyId) return;

  // Attached centrally so every event — page views above all — carries the
  // referring agent. The developer's "this agent drove N views of this
  // property" report is a GROUP BY over exactly this field.
  const agentId = getReferral();
  // And the signed-in visitor, when there is one: a registered investor
  // quietly opening the same development four times is the warmest lead the
  // platform can see, and without this line that interest is anonymous.
  const userId = currentUserId();

  const body = JSON.stringify({
    type,
    propertyId,
    ...(agentId && { agentId }),
    ...(userId && { userId }),
    sessionId: sessionId(),
    source: sourceFromReferrer(),
    ...(metadata && { metadata }),
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${API_BASE}/analytics/track`,
        new Blob([body], { type: 'application/json' }),
      );
      return;
    }
  } catch {
    // Fall through to fetch.
  }

  fetch(`${API_BASE}/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body,
  }).catch(() => {});
}
