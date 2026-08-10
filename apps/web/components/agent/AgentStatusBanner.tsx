'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock3, ShieldCheck } from 'lucide-react';
import { agentsApi } from '../../lib/api/agents';

/**
 * Why the agent is (or is not) publicly listed.
 *
 * Verification and listing are separate states — an approved agent can still
 * be hidden by an unpaid fee — so a single "pending" message would be
 * misleading. Each case says what is wrong and what to do about it.
 */
export function AgentStatusBanner() {
  const { data: me } = useQuery({
    queryKey: ['agent', 'me'],
    queryFn: () => agentsApi.me(),
  });

  if (!me) return null;

  if (me.kybStatus === 'NOT_SUBMITTED') {
    return (
      <Banner
        tone="warn"
        icon={<AlertTriangle size={16} />}
        title="Your account is not verified yet"
        body="Submit your verification documents to appear in the agent directory."
        cta={{ label: 'Start verification', href: '/agent/profile#verification' }}
      />
    );
  }

  if (me.kybStatus === 'PENDING') {
    return (
      <Banner
        tone="info"
        icon={<Clock3 size={16} />}
        title="Verification under review"
        body="We are checking your documents. You will be listed as soon as this is approved."
      />
    );
  }

  if (me.kybStatus === 'REJECTED') {
    return (
      <Banner
        tone="error"
        icon={<AlertTriangle size={16} />}
        title="Verification needs attention"
        body={me.kybRejectionReason ?? 'Your documents could not be verified.'}
        cta={{ label: 'Update documents', href: '/agent/profile#verification' }}
      />
    );
  }

  // Approved but hidden — the fee has lapsed rather than anything being wrong
  // with their documents, so the wording must not imply otherwise.
  if (!me.isListed) {
    return (
      <Banner
        tone="warn"
        icon={<AlertTriangle size={16} />}
        title="Your profile is hidden"
        body="Your listing fee is unpaid, so your profile is not showing in the directory. Settle it to be listed again."
        cta={{ label: 'Go to billing', href: '/agent/billing' }}
      />
    );
  }

  return (
    <Banner
      tone="ok"
      icon={<ShieldCheck size={16} />}
      title="You are verified and listed"
      body="Buyers and tenants can find you in the agent directory."
    />
  );
}

const TONES = {
  ok: 'bg-[#e6f4ea] text-[#188038]',
  info: 'bg-[#e8f0fe] text-[#1967d2]',
  warn: 'bg-[#fef7e0] text-[#b06000]',
  error: 'bg-[#fce8e6] text-[#c5221f]',
} as const;

function Banner({
  tone, icon, title, body, cta,
}: {
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 ${TONES[tone]}`}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium">{title}</p>
        <p className="text-[13px] opacity-90">{body}</p>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="shrink-0 rounded-full bg-white/70 px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-white"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
