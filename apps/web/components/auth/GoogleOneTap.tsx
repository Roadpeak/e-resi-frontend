'use client';

import { useEffect, useRef, useState } from 'react';
import { authApi } from '../../lib/api/auth';
import { track } from '../../lib/analytics/track';
import { useAuthStore } from '../../lib/stores/auth.store';
import { PhoneNumberPrompt } from '../account/PhoneNumberPrompt';

/**
 * Google One Tap on property pages, for visitors who aren't signed in.
 *
 * One tap signs them in, or creates their account, in the background: they
 * stay on the page they were reading. The view is then recorded again under
 * their account, so the developer sees an identified, contactable lead
 * instead of an anonymous visit. Google's own prompt is dismissible and
 * backs off by itself when someone keeps closing it.
 */

interface GoogleId {
  initialize: (opts: Record<string, unknown>) => void;
  prompt: () => void;
  cancel: () => void;
}
declare global {
  interface Window { google?: { accounts?: { id?: GoogleId } } }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

function loadGis(): Promise<GoogleId | null> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const s = existing ?? document.createElement('script');
    s.addEventListener('load', () => resolve(window.google?.accounts?.id ?? null));
    s.addEventListener('error', () => resolve(null));
    if (!existing) {
      s.src = GIS_SRC;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
  });
}

export function GoogleOneTap({ propertyId, role = 'INVESTOR' }: { propertyId?: string; role?: 'INVESTOR' | 'TENANT' }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [signedInName, setSignedInName] = useState('');
  const [toast, setToast] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // A stored token means a session is being restored — don't prompt over it.
    if (isAuthenticated || accessToken || started.current) return;
    started.current = true;
    let cancelled = false;
    let gis: GoogleId | null = null;

    const timer = window.setTimeout(async () => {
      try {
        const { clientId } = await authApi.googleClientId();
        if (!clientId || cancelled) return;
        gis = await loadGis();
        if (!gis || cancelled) return;
        gis.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          itp_support: true,
          use_fedcm_for_prompt: true,
          callback: async ({ credential }: { credential?: string }) => {
            if (!credential) return;
            try {
              const res = await authApi.googleOneTap(credential, role);
              useAuthStore.getState().setToken(res.accessToken);
              const me = await authApi.me().catch(() => res.user);
              setUser(me, res.accessToken);
              setSignedInName(me.firstName || 'you');
              setToast(true);
              window.setTimeout(() => setToast(false), 4000);
              // Attribute this visit to the new account: the developer's leads
              // list picks up signed-in viewers of their development.
              if (propertyId) track({ type: 'PAGE_VIEW', propertyId });
            } catch {
              // Silent: the visitor simply keeps browsing signed out.
            }
          },
        });
        gis.prompt();
      } catch {
        // No Google sign-in available here; nothing to show.
      }
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      try { gis?.cancel(); } catch { /* not shown */ }
    };
  }, [isAuthenticated, accessToken, propertyId, role, setUser]);

  if (!signedInName && !isAuthenticated) return null;
  return (
    <>
      {toast && (
        <div role="status" className="fixed left-1/2 top-4 z-[90] -translate-x-1/2 rounded-full bg-[#202124] px-4 py-2 text-[13.5px] text-white shadow-lg">
          Signed in as {signedInName}. You can keep browsing.
        </div>
      )}
      {/* One Tap is a sign-in too: ask for a phone number while they're here. */}
      {signedInName && <PhoneNumberPrompt />}
    </>
  );
}
