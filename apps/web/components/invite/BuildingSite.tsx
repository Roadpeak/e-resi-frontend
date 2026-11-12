'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { LogoMark } from '../brand/Logo';

/**
 * The "building your website" interlude between signup and the dashboard.
 *
 * Nothing is actually being built in these five seconds — the site was
 * activated as the account was created — but arriving on a dashboard the
 * instant a form is submitted makes the website feel like a settings page.
 * A short, deliberate construction sequence makes it feel like something
 * was made for them, which is the promise the invite made.
 */
export function BuildingSite({
  kind,
  siteUrl,
  durationMs = 5000,
  onDone,
}: {
  kind: 'AGENT' | 'DEVELOPER';
  siteUrl: string | null;
  durationMs?: number;
  onDone: () => void;
}) {
  const steps = kind === 'AGENT'
    ? [
      siteUrl ? `Reserving ${siteUrl.replace(/^https?:\/\//, '')}` : 'Reserving your e-resi address',
      'Applying your branding',
      'Setting up listings and lead capture',
      'Verifying your account',
      'Connecting your dashboard',
    ]
    : [
      'Creating your developer workspace',
      'Preparing your development website engine',
      'Switching on tours, chat and documents',
      'Verifying your company',
      'Connecting your dashboard',
    ];
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const per = durationMs / steps.length;
    const timers = steps.map((_, n) => setTimeout(() => setI(n + 1), per * (n + 1)));
    const done = setTimeout(() => setFinished(true), durationMs + 350);
    const leave = setTimeout(onDone, durationMs + 1100);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); clearTimeout(leave); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = Math.min(100, Math.round((i / steps.length) * 100));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white font-google text-[#202124]"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md px-6">
        <div className="flex items-center justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="46" fill="none" stroke="#e8eaed" strokeWidth="4" />
              <motion.circle
                cx="50" cy="50" r="46" fill="none" stroke="#1a73e8" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - pct / 100) }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </svg>
            <AnimatePresence mode="wait">
              {finished ? (
                <motion.span key="done" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a73e8] text-white">
                  <Check size={24} strokeWidth={3} />
                </motion.span>
              ) : (
                <motion.span key="mark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LogoMark size={40} />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <h1 className="mt-8 text-center text-[28px] font-normal leading-tight">
          {finished ? (kind === 'AGENT' ? 'Your website is live' : 'Your workspace is ready') : (kind === 'AGENT' ? 'Building your website' : 'Setting up your workspace')}
        </h1>
        <p className="mt-2 text-center text-[15px] text-[#5f6368]">
          {finished ? 'Taking you to your dashboard…' : 'This takes a few seconds.'}
        </p>

        <ol className="mt-8 space-y-2.5">
          {steps.map((s, n) => {
            const done = n < i;
            const active = n === i && !finished;
            return (
              <motion.li
                key={s}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: done || active ? 1 : 0.35, x: 0 }}
                transition={{ delay: n * 0.08 }}
                className="flex items-center gap-3 text-[14px]"
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${done ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : active ? 'border-[#1a73e8]' : 'border-[#dadce0]'}`}>
                  {done ? <Check size={12} strokeWidth={3} /> : active ? <span className="h-2 w-2 animate-pulse rounded-full bg-[#1a73e8]" /> : null}
                </span>
                <span className={done ? 'text-[#202124]' : active ? 'font-medium text-[#202124]' : 'text-[#5f6368]'}>{s}</span>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </motion.div>
  );
}
