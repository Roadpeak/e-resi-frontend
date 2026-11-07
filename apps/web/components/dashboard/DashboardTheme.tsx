'use client';

import { useEffect, useLayoutEffect, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import './dashboard-dark.css';

/**
 * Light / dark theme for the developer dashboard.
 *
 * The choice is stored per browser. It applies a class to <html> (not just the
 * dashboard's wrapper) so modals and menus rendered in portals follow it too,
 * and removes it when the dashboard unmounts, so public pages are never
 * affected. The colours themselves live in dashboard-dark.css.
 */

type Theme = 'light' | 'dark';
const KEY = 'eresi-dashboard-theme';
const EVENT = 'eresi-dashboard-theme';

function read(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useDashboardTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'light' as Theme);
  const setTheme = (t: Theme) => {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      // Private mode: the toggle still works for this page view.
    }
    document.documentElement.classList.toggle('dash-dark', t === 'dark');
    window.dispatchEvent(new Event(EVENT));
  };
  return { theme, setTheme };
}

// useLayoutEffect warns during SSR; this keeps the class change before paint on the client.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Mounted once in the dashboard layout: keeps <html> in step with the choice. */
export function DashboardThemeSync() {
  const { theme } = useDashboardTheme();
  useIsoLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dash-dark', theme === 'dark');
    return () => root.classList.remove('dash-dark');
  }, [theme]);
  return null;
}

/** Round toggle for the top bar. */
export function DashboardThemeToggle() {
  const { theme, setTheme } = useDashboardTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:text-gray-900"
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
