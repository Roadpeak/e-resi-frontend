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
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  hydrate: () => Promise<void>;
}

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

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // continue regardless
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      refreshToken: async () => {
        try {
          const { accessToken } = await authApi.refresh();
          const user = await authApi.me();
          set({ accessToken, user, isAuthenticated: true });
          return true;
        } catch {
          set({ user: null, accessToken: null, isAuthenticated: false });
          return false;
        }
      },

      hydrate: async () => {
        const { accessToken } = get();
        if (!accessToken) return;
        set({ isLoading: true });
        try {
          const user = await authApi.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          // Token stale — try refresh
          const ok = await get().refreshToken();
          if (!ok) set({ isLoading: false });
          else set({ isLoading: false });
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
