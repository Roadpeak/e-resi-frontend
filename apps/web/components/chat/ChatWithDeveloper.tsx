'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';
import { chatApi } from '../../lib/api/chat';
import { useAuthStore } from '../../lib/stores/auth.store';

/**
 * "Chat with developer" launcher shown on public property / rental pages.
 * Investors & tenants: starts (or resumes) the conversation and opens their
 * messages. Logged-out visitors are sent to login and returned here.
 */
export function ChatWithDeveloper({
  propertySlug,
  rentListingSlug,
  className = '',
}: {
  propertySlug?: string;
  rentListingSlug?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // developers talk through their dashboard, not to themselves
  if (isAuthenticated && (user?.role === 'DEVELOPER' || user?.role === 'ADMIN')) return null;

  async function start() {
    setError('');
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    try {
      const conversation = await chatApi.start({ propertySlug, rentListingSlug });
      router.push(`/account/messages?c=${conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the chat.');
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        onClick={start}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#dadce0] bg-white px-6 py-3 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer disabled:opacity-60"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
        Chat with developer
      </button>
      {error && <p className="mt-2 text-sm text-[#c5221f]">{error}</p>}
    </div>
  );
}
