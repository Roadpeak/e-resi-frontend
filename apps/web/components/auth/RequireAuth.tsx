'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../lib/stores/auth.store';
import type { UserRole } from '../../lib/types';

interface RequireAuthProps {
  /** Roles allowed to view the wrapped content. Omit to allow any logged-in user. */
  roles?: UserRole[];
  children: React.ReactNode;
}

/**
 * Client-side route guard. Auth state lives in the persisted zustand store
 * (access token + user), so gating happens after hydration on the client:
 * unauthenticated users are sent to /login (with a redirect back), and
 * authenticated users lacking a required role are sent to their own area.
 */
export function RequireAuth({ roles, children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, accessToken, isAuthenticated } = useAuthStore();
  // The persisted store only exists client-side — wait one tick for rehydration.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Only the token is persisted; `user`/`isAuthenticated` arrive after the
  // async /me hydration. A token without a user means hydration is still in
  // flight (a failed hydrate clears the token), so hold the spinner, don't bounce.
  const pendingHydration = !!accessToken && !isAuthenticated;
  const allowed = isAuthenticated && (!roles || (user && roles.includes(user.role)));

  useEffect(() => {
    if (!hydrated || pendingHydration) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (!allowed) {
      // Send people to their own area rather than a generic one — an agent
      // bounced to /account would land somewhere with none of their work.
      const home =
        user?.role === 'DEVELOPER' || user?.role === 'ADMIN' ? '/dashboard'
        : user?.role === 'AGENT' ? '/agent'
        : '/account';
      router.replace(home);
    }
  }, [hydrated, pendingHydration, isAuthenticated, allowed, pathname, router, user?.role]);

  if (!hydrated || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return <>{children}</>;
}
