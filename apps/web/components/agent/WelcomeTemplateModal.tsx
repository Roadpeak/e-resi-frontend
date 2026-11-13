'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Check, Lock, X } from 'lucide-react';
import { agentSiteApi, type AgentTemplatesState } from '../../lib/api/agent-site';
import { ApiError } from '../../lib/api/client';
import { cn } from '../../lib/utils';
import { TemplateLivePreview } from './TemplateLivePreview';

/**
 * First-visit prompt for an invited agent: their website is live, now pick
 * how it looks. Opens when the dashboard is reached with ?welcome=1 (the
 * invite flow sends them here) and clears the flag on close, so it shows
 * once rather than on every visit.
 */
export function WelcomeTemplateModal() {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('welcome') === '1') setOpen(true);
  }, []);

  const { data: site } = useQuery({ queryKey: ['agent-site'], queryFn: agentSiteApi.mine, enabled: open });
  const { data } = useQuery({ queryKey: ['agent-templates'], queryFn: agentSiteApi.templates, enabled: open });
  const select = useMutation({
    mutationFn: agentSiteApi.selectTemplate,
    onSuccess: (next: AgentTemplatesState, key) => { qc.setQueryData(['agent-templates'], next); setChosen(key); setErr(''); },
    onError: (e) => setErr(e instanceof ApiError ? e.message : 'Could not apply that template'),
  });

  function close(to?: string) {
    setOpen(false);
    router.replace(to ?? '/agent');
  }

  const templates = data?.templates ?? [];
  const current = chosen ?? data?.current;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-[#202124]/50 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.25 }}
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white font-google sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#f1f3f4] px-6 py-5">
              <div>
                <p className="text-[12.5px] font-medium uppercase tracking-wider text-[#188038]">Welcome to e-resi</p>
                <h2 id="welcome-title" className="mt-1 text-[22px] font-normal text-[#202124]">Your website is live. Choose its template.</h2>
                {site?.url && (
                  <a href={site.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[14px] text-[#1a73e8] hover:underline">
                    {site.url.replace(/^https?:\/\//, '')} <ArrowUpRight size={14} />
                  </a>
                )}
              </div>
              <button type="button" onClick={() => close()} className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4]" aria-label="Close"><X size={18} /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {!data ? (
                <p className="text-[14px] text-[#5f6368]">Loading templates…</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((t) => {
                    const usable = t.free || t.unlocked;
                    const active = current === t.key;
                    return (
                      <li key={t.key} className={cn('rounded-2xl border p-2.5 transition-colors', active ? 'border-[#1a73e8] bg-[#e8f0fe]/40' : 'border-[#e8eaed]')}>
                        <TemplateLivePreview k={t.key} />
                        <div className="mt-2.5 flex items-start justify-between gap-2 px-0.5">
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-medium text-[#202124]">{t.name}</p>
                            <p className="text-[12px] text-[#80868b]">{t.free ? 'Free' : t.unlocked ? 'Unlocked' : `Premium · ${data.currency} ${t.unlockPrice.toLocaleString()}`}</p>
                          </div>
                          {!usable && <Lock size={14} className="mt-1 shrink-0 text-[#9aa0a6]" />}
                        </div>
                        {usable ? (
                          <button type="button" onClick={() => select.mutate(t.key)} disabled={select.isPending || active}
                            className={cn('mt-2.5 w-full rounded-full py-1.5 text-[13px] font-medium', active ? 'bg-[#1a73e8] text-white' : 'border border-[#dadce0] text-[#1a73e8] hover:bg-[#f8f9fa]')}>
                            {active ? <span className="inline-flex items-center gap-1"><Check size={13} strokeWidth={3} /> Selected</span> : 'Use this'}
                          </button>
                        ) : (
                          <Link href="/agent/website" onClick={() => setOpen(false)} className="mt-2.5 block w-full rounded-full border border-[#dadce0] py-1.5 text-center text-[13px] font-medium text-[#5f6368] hover:bg-[#f8f9fa]">Unlock</Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {err && <p className="mt-3 text-[13px] text-[#c5221f]">{err}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f3f4] px-6 py-4">
              <p className="text-[13px] text-[#5f6368]">You can switch templates any time. Next, add your photo, listings and content.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => close()} className="rounded-full px-4 py-2 text-[14px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Maybe later</button>
                <button type="button" onClick={() => close('/agent/website')} className="rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc]">Customize website</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
