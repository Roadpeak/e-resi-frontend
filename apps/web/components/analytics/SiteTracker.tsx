'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../lib/stores/auth.store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const VISITOR_KEY = 'e-resi-vid';
const SESSION_KEY = 'e-resi-sid';
/** A session ends after this long without a page view. */
const SESSION_IDLE_MS = 30 * 60 * 1000;

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Storage can throw (private mode, blocked site data) — fall back to memory. */
const memory: Record<string, string> = {};
function read(key: string) {
  try { return localStorage.getItem(key); } catch { return memory[key] ?? null; }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { memory[key] = value; }
}

function visitorId() {
  let id = read(VISITOR_KEY);
  if (!id) write(VISITOR_KEY, (id = newId()));
  return id;
}

/** Returns the session id and whether this view started a new session. */
function touchSession(): { id: string; isNew: boolean } {
  const now = Date.now();
  try {
    const s = JSON.parse(read(SESSION_KEY) ?? 'null') as { id: string; last: number } | null;
    if (s && now - s.last < SESSION_IDLE_MS) {
      write(SESSION_KEY, JSON.stringify({ id: s.id, last: now }));
      return { id: s.id, isNew: false };
    }
  } catch {
    // Corrupt entry — start over.
  }
  const id = newId();
  write(SESSION_KEY, JSON.stringify({ id, last: now }));
  return { id, isNew: true };
}

function post(path: string, body: unknown, token?: string | null) {
  // keepalive lets the request outlive the page, so the time-on-page report
  // still lands when the tab is closed.
  return fetch(`${API}${path}`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

/**
 * Records every page view — signed in or not — for the admin traffic report.
 * Location and device are worked out server-side from Cloudflare's headers
 * and the user agent; this only says which page, from where, and for how long.
 * Admin pages are left out so staff browsing doesn't skew the numbers.
 */
export function SiteTracker() {
  const pathname = usePathname();
  const current = useRef<{ id: string; started: number } | null>(null);

  useEffect(() => {
    const flush = () => {
      const c = current.current;
      if (!c) return;
      current.current = null;
      post(`/traffic/hit/${c.id}/duration`, {
        visitorId: visitorId(),
        durationMs: Date.now() - c.started,
      }).catch(() => undefined);
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    // Close out the page being left before counting the new one.
    const prev = current.current;
    if (prev) {
      current.current = null;
      post(`/traffic/hit/${prev.id}/duration`, {
        visitorId: visitorId(),
        durationMs: Date.now() - prev.started,
      }).catch(() => undefined);
    }

    const session = touchSession();
    const params = new URLSearchParams(window.location.search);
    let cancelled = false;
    post(
      '/traffic/hit',
      {
        visitorId: visitorId(),
        sessionId: session.id,
        // On a development's own domain every path is that development's, so
        // keep the host — "/" there is not e-resi's home page.
        // name.e-resi.com is a development's address too, not e-resi itself.
        path: /^((www|app)\.)?e-resi\.com$|^localhost$/.test(window.location.hostname)
          ? pathname
          : `//${window.location.hostname}${pathname}`,
        // Lets the API attribute the view to the development this host serves.
        host: window.location.hostname,
        // Only the landing page has an outside referrer worth keeping.
        referrer: session.isNew ? document.referrer || undefined : undefined,
        utmSource: params.get('utm_source') ?? undefined,
        utmMedium: params.get('utm_medium') ?? undefined,
        utmCampaign: params.get('utm_campaign') ?? undefined,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      useAuthStore.getState().accessToken,
    )
      .then((r) => r.json())
      .then((json) => {
        const id = json?.data?.id;
        if (id && !cancelled) current.current = { id, started: Date.now() };
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
