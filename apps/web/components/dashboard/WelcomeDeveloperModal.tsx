'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import { PICKER_TEMPLATES } from '../../lib/branding/templates';
import { TemplatePreviewCard } from './TemplatePreviewCard';

/**
 * First-visit prompt for an invited developer: verified on arrival, so the
 * next step is their first development and the look of its website.
 * Opens on ?welcome=1 and clears the flag on close.
 */
export function WelcomeDeveloperModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('welcome') === '1') setOpen(true);
  }, []);

  function close(to?: string) {
    setOpen(false);
    router.replace(to ?? '/dashboard');
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-[#202124]/50 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="welcome-dev-title">
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.25 }}
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white font-google sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#f1f3f4] px-6 py-5">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[12.5px] font-medium uppercase tracking-wider text-[#188038]"><ShieldCheck size={14} /> Verified developer</p>
                <h2 id="welcome-dev-title" className="mt-1 text-[22px] font-normal text-[#202124]">Your workspace is ready. Pick a look for your development websites.</h2>
                <p className="mt-1 text-[14px] text-[#5f6368]">Every development you add gets its own website on a free e-resi address. Choose a template now; you can change it per development later.</p>
              </div>
              <button type="button" onClick={() => close()} className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4]" aria-label="Close"><X size={18} /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PICKER_TEMPLATES.map((t) => (
                  <li key={t.key}>
                    <button type="button" onClick={() => { try { localStorage.setItem('e-resi-preferred-template', t.key); } catch { /* ignore */ } close('/dashboard/developments/new'); }}
                      className="group w-full rounded-2xl border border-[#e8eaed] p-2.5 text-left transition-colors hover:border-[#1a73e8]">
                      <TemplatePreviewCard template={t} brandColor="#4A80F5" />
                      <div className="mt-2.5 px-0.5">
                        <p className="text-[14px] font-medium text-[#202124]">{t.label}{t.isNew && <span className="ml-2 rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-medium text-[#1967d2]">New</span>}</p>
                        <p className="text-[12.5px] text-[#80868b]">{t.note}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f3f4] px-6 py-4">
              <p className="text-[13px] text-[#5f6368]">Add your first development to launch its website, tours and lead capture.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => close()} className="rounded-full px-4 py-2 text-[14px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Maybe later</button>
                <button type="button" onClick={() => close('/dashboard/developments/new')} className="rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc]">Create my first development</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
