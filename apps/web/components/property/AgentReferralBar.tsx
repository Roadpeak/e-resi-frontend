'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { agentsApi } from '../../lib/api/agents';
import { getReferral } from '../../lib/analytics/referral';

/**
 * The co-branded storefront bar.
 *
 * When a visitor arrives through an agent's link, the page should feel like
 * that agent's page — their face, their name, their WhatsApp one tap away —
 * because the agent is the reason this visitor is here at all, and a
 * platform that erases them on arrival teaches agents to keep buyers away
 * from it. One floating bar, template-agnostic, so every mini-site design
 * gets the behaviour without eight templates each growing a variant.
 *
 * Renders nothing unless a referral is stored AND it resolves to a listed,
 * verified agent — an expired link or a delisted agent degrades to the
 * ordinary page, never to an error.
 */
export function AgentReferralBar() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Read after mount: the referral lives in localStorage, which the server
  // render cannot see, and a hydration mismatch here would flash the bar.
  useEffect(() => {
    setAgentId(getReferral());
  }, []);

  const { data: agent } = useQuery({
    queryKey: ['referral-agent', agentId],
    queryFn: () => agentsApi.get(agentId as string),
    enabled: !!agentId,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  if (!agent || dismissed) return null;
  const avatar = agent.photoUrl ?? agent.logoUrl;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
        className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
      >
        <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-black/10 bg-white/95 py-2 pl-2 pr-2 shadow-xl backdrop-blur">
          {avatar ? (
            // Unoptimized: agents upload avatars from anywhere, and next/image
            // throws outright on a hostname next.config doesn't list — a
            // stranger's avatar must never be able to crash a property page.
            <Image src={avatar} alt={agent.displayName} width={40} height={40} unoptimized
              className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[15px] font-medium text-[#1967d2]">
              {agent.displayName.slice(0, 1)}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium text-[#202124]">
              {agent.displayName}
            </span>
            <span className="block text-[11.5px] text-[#5f6368]">
              Your agent for this property
              {agent.ratingCount > 0 && ` · ★ ${agent.ratingAverage.toFixed(1)}`}
            </span>
          </span>
          {agent.whatsapp && (
            <a
              href={`https://wa.me/${agent.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-[#25D366] px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            >
              WhatsApp
            </a>
          )}
          {!agent.whatsapp && agent.phone && (
            <a href={`tel:${agent.phone}`}
              className="shrink-0 rounded-full bg-[#1a73e8] px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
              Call
            </a>
          )}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="shrink-0 cursor-pointer rounded-full p-1.5 text-[#5f6368] transition-colors hover:bg-black/5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
