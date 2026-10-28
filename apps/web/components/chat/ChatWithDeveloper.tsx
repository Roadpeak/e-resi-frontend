'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';
import { chatApi } from '../../lib/api/chat';
import { getReferral } from '../../lib/analytics/referral';
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
  tone = 'light',
  variant = 'button',
  label = 'Chat with developer',
}: {
  propertySlug?: string;
  rentListingSlug?: string;
  className?: string;
  /**
   * Dark grounds — the hero photograph, dark templates — need the inverse
   * treatment. The light styling is a white pill, which over a render reads as
   * a second primary action competing with the actual CTA beside it.
   */
  tone?: 'light' | 'dark';
  /**
   * `icon` is a square glyph-only control, for places where a full pill would
   * crowd the layout. It keeps an accessible name via aria-label and title.
   */
  variant?: 'button' | 'icon';
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Developers and admins see the button too — hiding it made it look
  // missing when they previewed a page — but for them it opens the inbox
  // where buyers' chats arrive rather than starting a chat with themselves.
  const staff = isAuthenticated && (user?.role === 'DEVELOPER' || user?.role === 'ADMIN');

  async function start() {
    setError('');
    if (staff) {
      router.push(user?.role === 'DEVELOPER' ? '/dashboard/messages' : '/admin');
      return;
    }
    if (!isAuthenticated) {
      // On a development's own domain or e-resi address there is no e-resi
      // session (sign-in lives on e-resi.com), so sign in there and come back
      // to this development's e-resi page, where the chat opens.
      const host = window.location.hostname;
      const onEresi = /^((www|app)\.)?e-resi\.com$|^localhost$/.test(host);
      if (!onEresi) {
        const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://e-resi.com';
        const back = propertySlug ? `/${propertySlug}` : '/';
        window.location.href = `${site}/login?redirect=${encodeURIComponent(back)}`;
        return;
      }
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    try {
      // A visitor who arrived through an agent's link chats with that agent,
      // not the developer — the API routes the thread to whoever actually
      // holds the relationship (and falls back to the developer when the
      // referral has no active partnership behind it).
      const agentId = propertySlug ? (getReferral() ?? undefined) : undefined;
      const conversation = await chatApi.start({ propertySlug, rentListingSlug, agentId });
      router.push(`/account/messages?c=${conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the chat.');
      setBusy(false);
    }
  }

  const onDark = tone === 'dark';
  const Glyph = busy ? Loader2 : MessageCircle;

  if (variant === 'icon') {
    return (
      <div className={className}>
        <button
          onClick={start}
          disabled={busy}
          aria-label={label}
          title={label}
          className={`inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
            onDark
              ? // Stronger than a 10% wash. This can land on a bright sky as
                // easily as on a dark façade, so it carries its own ground
                // rather than relying on the photograph behind it.
                'border-white/40 bg-black/35 text-white backdrop-blur-md hover:border-white/70 hover:bg-black/50'
              : 'border-[#dadce0] bg-white text-[#1a73e8] hover:bg-[#f8fbff]'
          }`}
        >
          <Glyph size={19} className={busy ? 'animate-spin' : undefined} />
        </button>
        {error && (
          <p className={`mt-2 text-sm ${onDark ? 'text-red-300' : 'text-[#c5221f]'}`}>{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={start}
        disabled={busy}
        className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-6 py-3 text-[15px] font-medium transition-colors disabled:opacity-60 ${
          onDark
            ? 'border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
            : 'border-[#dadce0] bg-white text-[#1a73e8] hover:bg-[#f8fbff]'
        }`}
      >
        <Glyph size={16} className={busy ? 'animate-spin' : undefined} />
        {label}
      </button>
      {error && (
        <p className={`mt-2 text-sm ${onDark ? 'text-red-300' : 'text-[#c5221f]'}`}>{error}</p>
      )}
    </div>
  );
}
