'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { authApi } from '../../lib/api/auth';
import { useAuthStore } from '../../lib/stores/auth.store';
import { homePathFor } from '../../lib/auth/role-home';

/**
 * Landing point for the Google redirect.
 *
 * The API puts the access token in the URL fragment — a fragment is never sent
 * to a server, so it stays out of access logs and Referer headers. It is read
 * once, stripped from the address bar, then exchanged for the user record.
 */
export function GoogleComplete() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const [error, setError] = useState('');
  // Effects can run twice (StrictMode, fast refresh); the token is single-use
  // in the sense that we strip it from the URL, so guard against a second pass.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = params.get('access_token');

      if (!accessToken) {
        setError('Sign-in did not complete. Please try again.');
        return;
      }

      // Drop the token from the address bar before anything else, so it is not
      // left in history or copied out of a shared screen.
      window.history.replaceState(null, '', window.location.pathname);

      try {
        // Seed the token so apiClient can authorise this call, then read the
        // account it belongs to.
        setToken(accessToken);
        const user = await authApi.me();
        setUser(user, accessToken);
        router.replace(homePathFor(user.role));
      } catch {
        setError('We could not complete your sign-in. Please try again.');
      }
    };

    void run();
  }, [router, setUser, setToken]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6">
      <Logo markSize={34} textClassName="text-ink text-2xl" />

      {error ? (
        <div className="text-center">
          <p className="text-[15px] text-gray-600">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="mt-5 cursor-pointer rounded-lg bg-gray-900 px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-gray-700"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-[15px]">Signing you in…</span>
        </div>
      )}
    </div>
  );
}
