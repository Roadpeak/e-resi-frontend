'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';
import { setAuthHandlers } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User, token: string) => void;
  /**
   * Store a token before the user record is known. Used by the OAuth landing
   * page, which receives a token in the redirect and must authorise the /me
   * call that fetches the account it belongs to.
   */
  setToken: (token: string) => void;
  /** Merge fresh fields into the cached user (e.g. after a profile save). */
  patchUser: (patch: Partial<User>) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  hydrate: () => Promise<void>;
}

/** Shared across callers so concurrent 401s trigger a single refresh. */
let refreshInFlight: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true });
      },

      setToken: (accessToken) => {
        // Deliberately not authenticated yet: there is no user record, and the
        // guards key off isAuthenticated. The caller sets it via setUser once
        // /me returns.
        set({ accessToken });
      },

      patchUser: (patch) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...patch } });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // continue regardless
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      refreshToken: async () => {
        // Several requests can 401 at once; share one refresh between them
        // instead of firing a burst of parallel refresh calls.
        if (refreshInFlight) return refreshInFlight;

        refreshInFlight = (async () => {
          try {
            const { accessToken } = await authApi.refresh();
            // Store the new token BEFORE the follow-up /me: that call reads
            // the token from this store, and with the old expired one it
            // would 401 → ask for a refresh → be handed this very promise →
            // await itself forever. That deadlock was the "site stuck on a
            // spinner" bug. noRefresh below is the second lock on that door.
            set({ accessToken });
            const user = await authApi.me({ noRefresh: true });
            set({ user, isAuthenticated: true });
            return true;
          } catch {
            set({ user: null, accessToken: null, isAuthenticated: false });
            return false;
          } finally {
            refreshInFlight = null;
          }
        })();

        return refreshInFlight;
      },

      hydrate: async () => {
        const { accessToken, isLoading } = get();
        if (!accessToken || isLoading) return;
        set({ isLoading: true });
        try {
          // noRefresh: on 401 the catch below runs the one refresh attempt
          // itself — letting the client also refresh would mean two.
          const user = await authApi.me({ noRefresh: true });
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          // Token stale — try refresh. Either way hydration is over: a
          // failed refresh has cleared the token, and the route guards
          // handle the redirect from there.
          await get().refreshToken();
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'e-resi-auth',
      // Only persist the token; user is re-fetched on mount
      partialize: (s) => ({ accessToken: s.accessToken }),
    },
  ),
);

// Wire API client to use our store's token + refresh handler
// This runs once when the module is first imported
setAuthHandlers(
  () => useAuthStore.getState().accessToken,
  () => useAuthStore.getState().refreshToken(),
);
