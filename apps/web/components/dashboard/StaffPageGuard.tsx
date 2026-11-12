'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/stores/auth.store';

/**
 * Client-side page gate for staff logins: a page the employer didn't tick
 * bounces to the overview instead of rendering. Runs inside the dashboard
 * layout so every page is covered without touching each one.
 */
export function StaffPageGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const router = useRouter();

  // Works for /dashboard/* and /agent/*: the first segment is the portal.
  const [, portal, key = ''] = pathname.split('/');
  const home = `/${portal}`;
  const blocked = !!user?.isStaff && key !== '' && key !== 'support' && key !== 'my-profile' && !(user.staffPages ?? []).includes(key);

  useEffect(() => {
    if (blocked) router.replace(home);
  }, [blocked, router, home]);

  if (blocked) return null;
  return <>{children}</>;
}
