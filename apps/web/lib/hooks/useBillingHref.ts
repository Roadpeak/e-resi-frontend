'use client';

import { useAuthStore } from '../stores/auth.store';

/** The signed-in account's billing page: agents have their own under /agent. */
export function useBillingHref() {
  const role = useAuthStore((s) => s.user?.role);
  return role === 'AGENT' ? '/agent/billing' : '/dashboard/billing';
}
