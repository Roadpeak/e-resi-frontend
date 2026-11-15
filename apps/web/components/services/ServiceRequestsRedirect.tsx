'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../lib/stores/auth.store';
import { serviceRequestsBase } from '../../lib/services/portal';

/**
 * The old /services/requests addresses — in emails, notifications and card
 * payment returns — forward into the signed-in user's own portal, keeping the
 * query string (?sent, ?action, Paystack's ?reference).
 */
export function ServiceRequestsRedirect({ id }: { id?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    if (!user) return;
    const base = serviceRequestsBase(user.role);
    router.replace(`${base}${id ? `/${id}` : ''}${window.location.search}`);
  }, [user, id, router]);
  return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-[#5f6368]" /></div>;
}
