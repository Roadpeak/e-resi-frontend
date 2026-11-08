'use client';

import { createContext, useContext } from 'react';

/**
 * Where development-management pages live in the current portal. The same
 * pages serve developers (/dashboard/properties) and agents managing their
 * own listings (/agent/listings); every internal link is built from this so
 * neither portal sends its user into the other.
 */
const PropertyBaseContext = createContext('/dashboard/properties');

export function PropertyBaseProvider({ base, children }: { base: string; children: React.ReactNode }) {
  return <PropertyBaseContext.Provider value={base}>{children}</PropertyBaseContext.Provider>;
}

export function usePropertyPaths() {
  const base = useContext(PropertyBaseContext);
  const agent = base.startsWith('/agent');
  return { base, newHref: agent ? '/agent/listings/new' : '/dashboard/developments/new', agent };
}
