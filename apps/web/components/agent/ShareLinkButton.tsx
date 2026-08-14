'use client';

import { useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { buildReferralUrl } from '../../lib/analytics/referral';

interface Props {
  /** Path to share, e.g. `/kilimani-heights`. */
  path: string;
  /** The agent's own profile id — what the credit is attached to. */
  agentId: string;
  label?: string;
  className?: string;
}

/**
 * Copy a shareable link that credits this agent.
 *
 * Without this nothing on the platform ever produces a `?ref=`, so the
 * attribution columns stay empty however well the capture works. This is the
 * thing that actually starts the chain: the agent shares from here, the
 * visitor's referral is captured on arrival, and whatever they submit later
 * is credited back.
 */
export function ShareLinkButton({ path, agentId, label = 'Copy my link', className }: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = buildReferralUrl(path, agentId);
    try {
      // A phone hands straight off to WhatsApp, which is where these links
      // actually travel.
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // A dismissed share sheet throws; nothing to report.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={
        className
        ?? 'inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3.5 py-2 text-[13px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4] cursor-pointer'
      }
      title="Anyone who enquires through this link is credited to you"
    >
      {copied ? <Check size={14} /> : navigator?.share ? <Share2 size={14} /> : <Link2 size={14} />}
      {copied ? 'Link copied' : label}
    </button>
  );
}
