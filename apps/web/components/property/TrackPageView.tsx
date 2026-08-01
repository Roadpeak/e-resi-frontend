'use client';

import { useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function sessionId(): string {
  try {
    let id = sessionStorage.getItem('e-resi-session');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('e-resi-session', id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
}

function sourceFromReferrer(): string {
  try {
    if (!document.referrer) return 'Direct';
    const host = new URL(document.referrer).hostname;
    if (host === window.location.hostname) return 'Direct';
    if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(host)) return 'Search';
    if (/facebook\.|instagram\.|twitter\.|x\.com|tiktok\.|linkedin\.|youtube\./.test(host)) return 'Social';
    return 'Referral';
  } catch {
    return 'Direct';
  }
}

/** Fire-and-forget PAGE_VIEW analytics event for a property page. */
export function TrackPageView({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    if (!propertyId) return;
    fetch(`${API_BASE}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        type: 'PAGE_VIEW',
        propertyId,
        sessionId: sessionId(),
        source: sourceFromReferrer(),
      }),
    }).catch(() => {});
  }, [propertyId]);

  return null;
}
