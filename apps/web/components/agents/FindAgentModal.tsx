'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Users, X } from 'lucide-react';
import {
  SPECIALTY_LABELS,
  agentsApi,
  type AgentKind,
  type AgentSpecialty,
} from '../../lib/api/agents';
import { AgentCard } from '../directory/AgentCard';
import { cn } from '../../lib/utils';

const TABS: { key: AgentKind; label: string }[] = [
  { key: 'COMPANY', label: 'Companies' },
  { key: 'INDIVIDUAL', label: 'Individual agents' },
];

/**
 * The agent picker opened from the browse pages.
 *
 * Scoped to one specialty by whichever page opened it, so a tenant browsing
 * rentals only ever sees agents who actually do rentals. Ordering is the
 * API's — by rating, then review count — so the picker cannot disagree with
 * the directory about who is best rated.
 */
export function FindAgentModal({
  open,
  onClose,
  specialty,
}: {
  open: boolean;
  onClose: () => void;
  specialty: AgentSpecialty;
}) {
  const [tab, setTab] = useState<AgentKind>('COMPANY');

  // Escape is the reflex for dismissing a modal; without it the only way out
  // is the small X.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // The page behind must not scroll while the sheet is over it.
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = prev; };
  }, [open]);

  const { data, isLoading } = useQuery({
    queryKey: ['find-agent', specialty, tab],
    queryFn: () => agentsApi.list({ specialty, kind: tab, limit: 12 }),
    enabled: open,
  });

  const agents = data?.data ?? [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Find an agent"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            // Clicks inside must not fall through to the backdrop's close.
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-[#f0f0f2] sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] bg-white px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-[18px] font-semibold text-[#111112]">
                  Agents who handle {SPECIALTY_LABELS[specialty].toLowerCase()}
                </h2>
                <p className="mt-0.5 text-[13px] text-[#6b6b70]">
                  Verified agents, best rated first.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6b6b70] transition-colors hover:bg-[#f0f0f2] hover:text-[#111112] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-1.5 border-b border-black/[0.06] bg-white px-5 pb-3">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors cursor-pointer',
                    tab === t.key
                      ? 'bg-[#111112] text-white'
                      : 'bg-[#f0f0f2] text-[#6b6b70] hover:bg-[#e8e8ea]',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={22} className="animate-spin text-[#8a8a90]" />
                </div>
              ) : agents.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <Users size={28} className="text-[#c4c4c8]" />
                  <p className="text-[14px] text-[#6b6b70]">
                    No {tab === 'COMPANY' ? 'agencies' : 'individual agents'} listed for this yet.
                  </p>
                  <button
                    onClick={() => setTab(tab === 'COMPANY' ? 'INDIVIDUAL' : 'COMPANY')}
                    className="mt-1 text-[14px] font-medium text-[#4A80F5] hover:text-[#3457E0] cursor-pointer"
                  >
                    Try {tab === 'COMPANY' ? 'individual agents' : 'companies'}
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {agents.map((a) => (
                    <AgentCard key={a.id} agent={a} compact />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
