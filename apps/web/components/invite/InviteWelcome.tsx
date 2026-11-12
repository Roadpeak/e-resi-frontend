'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Building2, Check, Eye, EyeOff, Globe, Handshake, LayoutDashboard, Lock, Mail, MessageSquare,
  Phone, Radar, Search, ShieldCheck, User, Users, Video,
} from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Input } from '../ui/Input';
import { ApiError } from '../../lib/api/client';
import { invitesApi, type InviteWelcome as Invite } from '../../lib/api/invites';
import { ALL_SPECIALTIES, SPECIALTY_LABELS, type AgentSpecialty } from '../../lib/api/agents';
import { useAuthStore } from '../../lib/stores/auth.store';
import { cn } from '../../lib/utils';
import { BuildingSite } from './BuildingSite';

/**
 * The page behind a personal invite link.
 *
 * Addressed to one agent or developer: their name and logo, the team's
 * note to them, then what joining gives them and a single call to action.
 * Signup happens here too — no email code, no documents, because the team
 * already vouched for them — and ends in the website-building interlude
 * before the dashboard.
 */

const AGENT_PERKS = [
  { icon: Globe, title: 'Your own premium website, free', body: 'yourname.e-resi.com, ready in seconds, with every property you sell or let.' },
  { icon: LayoutDashboard, title: 'Your management dashboard', body: 'Listings, rentals, viewings, deals and messages in one place.' },
  { icon: Radar, title: 'Automated lead generation', body: 'Full details of every interested client who views your site or a listing.' },
  { icon: Users, title: 'Tracked link opens', body: 'Share your link anywhere and see who opened it and what they viewed.' },
  { icon: Handshake, title: 'Partnership with property developers', body: 'Get assigned developments to sell and earn on every closing.' },
  { icon: Search, title: 'Availability on e-resi listings', body: 'Your properties appear across the marketplace, not only on your site.' },
  { icon: ShieldCheck, title: 'Discovery by potential clients', body: 'Listed in the verified agent directory from day one.' },
];

const DEVELOPER_PERKS = [
  { icon: Globe, title: 'A branded website for every development, free', body: 'Launch each project on its own address in seconds and sell off-plan from it.' },
  { icon: Video, title: '3D, VR and cinematic tours', body: 'Buyers walk through units from anywhere; run live guided tours in a call.' },
  { icon: LayoutDashboard, title: 'Your developer dashboard', body: 'Units, availability, reservations, bookings and construction updates.' },
  { icon: MessageSquare, title: 'Chat and document sharing', body: 'Brochures, floor plans and agreements shared with buyers in one thread.' },
  { icon: Radar, title: 'Automated lead generation', body: 'Every interested buyer delivered with full details, with tracked link opens.' },
  { icon: Handshake, title: 'Partnership with verified agents', body: 'Assign developments to agents and track what each one brings in.' },
  { icon: Search, title: 'Availability on e-resi listings', body: 'Discovered by buyers and investors across the marketplace.' },
];

const DEFAULT_SPECIALTIES: AgentSpecialty[] = ['APARTMENT_RENTAL', 'APARTMENT_PURCHASE', 'VILLA_RENTAL', 'VILLA_PURCHASE'];

function Avatar({ inv, size = 72 }: { inv: Invite; size?: number }) {
  return (
    <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e8eaed] bg-[#f8f9fa]" style={{ width: size, height: size }}>
      {inv.logoUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={inv.logoUrl} alt={inv.name} className="h-full w-full object-cover" />
        : <span className="text-[26px] font-medium text-[#5f6368]">{inv.name.slice(0, 1).toUpperCase()}</span>}
    </div>
  );
}

export function InviteWelcome({ code }: { code: string }) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const { data: inv, error, isLoading } = useQuery({
    queryKey: ['invite', code],
    queryFn: () => invitesApi.open(code),
    // Each fetch counts as an open, so never refetch in the background.
    retry: false, staleTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  const [stage, setStage] = useState<'welcome' | 'signup' | 'building'>('welcome');
  const [result, setResult] = useState<{ siteUrl: string | null; next: string; kind: 'AGENT' | 'DEVELOPER' } | null>(null);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [stage]);

  if (isLoading) {
    return <Shell><p className="py-24 text-center text-[14px] text-[#5f6368]">Opening your invitation…</p></Shell>;
  }
  if (error || !inv) {
    return (
      <Shell>
        <div className="mx-auto max-w-md py-24 text-center">
          <h1 className="text-[26px] font-normal">This invite link is no longer valid</h1>
          <p className="mt-2 text-[15px] text-[#5f6368]">It may have been replaced or withdrawn. Ask the e-resi team member who shared it for a new one.</p>
          <Link href="/" className="mt-6 inline-flex rounded-full bg-[#202124] px-6 py-2.5 text-[14px] font-medium text-white">Go to e-resi</Link>
        </div>
      </Shell>
    );
  }

  const isAgent = inv.kind === 'AGENT';
  const first = inv.contactName?.trim().split(' ')[0];

  return (
    <Shell>
      <AnimatePresence>
        {stage === 'building' && result && (
          <BuildingSite kind={result.kind} siteUrl={result.siteUrl} onDone={() => router.replace(result.next)} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {stage === 'welcome' ? (
          <motion.div key="welcome" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {/* ── Addressed to them ── */}
            <section className="mx-auto max-w-3xl">
              <p className="text-[13px] font-medium uppercase tracking-wider text-[#1a73e8]">A personal invitation</p>
              <div className="mt-4 flex items-center gap-5">
                <Avatar inv={inv} />
                <div className="min-w-0">
                  <h1 className="text-[28px] font-normal leading-tight sm:text-[34px]">{first ? `Hi ${first}, ` : ''}this one is for {inv.name}</h1>
                  <p className="mt-1 text-[15px] text-[#5f6368]">
                    {isAgent ? 'Prepared for your agency by the e-resi team' : 'Prepared for your company by the e-resi team'} · shared by {inv.referrer}
                  </p>
                </div>
              </div>

              <blockquote className="mt-8 whitespace-pre-line rounded-3xl border border-[#dadce0] bg-white p-6 text-[16px] leading-relaxed text-[#3c4043] sm:p-8">
                {inv.message}
                <footer className="mt-5 text-[14px] text-[#5f6368]">— {inv.referrer}, e-resi team</footer>
              </blockquote>
            </section>

            {/* ── What awaits ── */}
            <section className="mx-auto mt-14 max-w-5xl">
              <div className="max-w-2xl">
                <h2 className="text-[24px] font-normal leading-snug sm:text-[28px]">
                  Complete your onboarding to get your custom premium website — free.
                </h2>
                <p className="mt-2 text-[15px] text-[#5f6368]">
                  {isAgent
                    ? 'e-resi is not another listing platform. It is the tool that makes your selling and letting faster, with your own site at the centre of it. Here is what is waiting once you sign up.'
                    : 'e-resi is built for selling developments before they are built. Here is what is waiting once you sign up.'}
                </p>
              </div>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(isAgent ? AGENT_PERKS : DEVELOPER_PERKS).map(({ icon: Icon, title, body }) => (
                  <li key={title} className="rounded-2xl border border-[#dadce0] bg-white p-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1967d2]"><Icon size={18} /></span>
                    <p className="mt-3 text-[15px] font-medium text-[#202124]">{title}</p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-[#5f6368]">{body}</p>
                  </li>
                ))}
                <li className="flex flex-col justify-center rounded-2xl bg-[#202124] p-5 text-white">
                  <p className="text-[22px] font-normal leading-tight">No commissions.</p>
                  <p className="text-[22px] font-normal leading-tight">100% free to start.</p>
                  <p className="mt-2 text-[13.5px] text-white/70">
                    {isAgent ? 'Your website, listings and leads cost nothing to switch on.' : 'Your first development website costs nothing to switch on.'}
                  </p>
                </li>
              </ul>

              <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                {inv.signedUp ? (
                  <>
                    <p className="text-[14px] text-[#5f6368]">This invite has already been used to create an account.</p>
                    <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-7 py-3 text-[15px] font-medium text-white hover:bg-[#1765cc]">Sign in <ArrowRight size={16} /></Link>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setStage('signup')}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-7 py-3 text-[15px] font-medium text-white hover:bg-[#1765cc] active:scale-[0.98] transition-all cursor-pointer">
                      Complete signup <ArrowRight size={16} />
                    </button>
                    <p className="text-[13.5px] text-[#5f6368]">Takes about a minute. No documents needed — you are already verified.</p>
                  </>
                )}
              </div>
            </section>
          </motion.div>
        ) : stage === 'signup' ? (
          <motion.div key="signup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <SignupForm
              inv={inv}
              code={code}
              onBack={() => setStage('welcome')}
              onDone={(r) => {
                setUser(r.user, r.accessToken);
                setResult({ siteUrl: r.siteUrl, next: r.next, kind: r.kind });
                setStage('building');
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white font-google text-[#202124]">
      <header className="flex h-16 items-center justify-between border-b border-[#f1f3f4] px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="e-resi home"><Logo markSize={26} textClassName="text-gray-900 text-[1.2rem]" /></Link>
          <span className="h-5 w-px bg-[#dadce0]" />
          <span className="text-sm text-[#5f6368]">Partner invitation</span>
        </div>
        <p className="text-sm text-[#5f6368]">
          <span className="hidden sm:inline">Already have an account? </span>
          <Link href="/login" className="font-medium text-[#1a73e8] hover:text-[#1765cc]">Sign in</Link>
        </p>
      </header>
      <main className="px-5 py-10 sm:px-8 lg:py-14">{children}</main>
    </div>
  );
}

// ─── Signup ───────────────────────────────────────────────────────────────

function SignupForm({ inv, code, onBack, onDone }: {
  inv: Invite;
  code: string;
  onBack: () => void;
  onDone: (r: { accessToken: string; user: import('../../lib/types').User; siteUrl: string | null; next: string; kind: 'AGENT' | 'DEVELOPER' }) => void;
}) {
  const isAgent = inv.kind === 'AGENT';
  const [contactFirst, ...contactRest] = (inv.contactName ?? '').trim().split(' ').filter(Boolean);
  const [form, setForm] = useState({
    firstName: contactFirst ?? '',
    lastName: contactRest.join(' '),
    email: inv.email ?? '',
    phone: inv.phone ?? '',
    password: '',
    name: inv.name,
    agree: false,
  });
  const [agentKind, setAgentKind] = useState<'COMPANY' | 'INDIVIDUAL'>(inv.agentKind ?? 'COMPANY');
  const [specialties, setSpecialties] = useState<AgentSpecialty[]>(DEFAULT_SPECIALTIES);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (isAgent && specialties.length === 0) { setErr('Choose at least one thing you handle.'); return; }
    if (!form.agree) { setErr('Please accept the terms to continue.'); return; }
    setLoading(true);
    try {
      const r = await invitesApi.accept(code, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        name: form.name.trim(),
        ...(isAgent && { agentKind, specialties }),
      });
      onDone(r);
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : 'Signup failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.3fr]">
      <aside className="lg:pt-2">
        <div className="flex items-center gap-4">
          <Avatar inv={inv} size={56} />
          <div>
            <p className="text-[15px] font-medium">{inv.name}</p>
            <p className="text-[13px] text-[#5f6368]">{isAgent ? 'Agent account' : 'Developer account'} · invited by {inv.referrer}</p>
          </div>
        </div>
        <ul className="mt-8 space-y-3 text-[14px] text-[#3c4043]">
          {[
            'Verified automatically — no documents to upload',
            isAgent ? 'Your website address goes live the moment you finish' : 'Your developer workspace is ready the moment you finish',
            'No commissions, free to start',
          ].map((t) => (
            <li key={t} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e6f4ea] text-[#188038]"><Check size={12} strokeWidth={3} /></span>
              {t}
            </li>
          ))}
        </ul>
        <button type="button" onClick={onBack} className="mt-8 text-[13.5px] text-[#5f6368] hover:text-[#202124]">← Back to your invitation</button>
      </aside>

      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-[#dadce0] bg-white p-6 sm:p-8">
        <h1 className="text-[24px] font-normal leading-snug">Create your account</h1>
        <p className="-mt-2 text-[14px] text-[#5f6368]">Check the details we prefilled and set a password.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} leftIcon={<User size={14} />} required minLength={2} />
          <Input label="Last name" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} leftIcon={<User size={14} />} required minLength={2} />
        </div>
        <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} leftIcon={<Mail size={14} />} required autoComplete="email" />
        <Input label="Phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} leftIcon={<Phone size={14} />} placeholder="+254712345678" autoComplete="tel" />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          leftIcon={<Lock size={14} />}
          rightIcon={<button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-400 hover:text-gray-600" aria-label="Toggle password">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>}
          required minLength={8} autoComplete="new-password"
          hint="At least 8 characters"
        />

        {isAgent && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">You are</span>
            <div className="grid grid-cols-2 gap-2">
              {([['COMPANY', 'An agency / company'], ['INDIVIDUAL', 'An individual agent']] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setAgentKind(v)}
                  className={cn('rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer', agentKind === v ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1967d2]' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50')}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        <Input
          label={isAgent ? (agentKind === 'COMPANY' ? 'Agency name' : 'Your professional name') : 'Company / developer name'}
          value={form.name} onChange={(e) => set('name', e.target.value)} leftIcon={<Building2 size={14} />} required minLength={2}
          hint={isAgent ? 'Your website address is made from this name.' : undefined}
        />

        {isAgent && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">What do you handle?</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SPECIALTIES.map((s) => {
                const on = specialties.includes(s);
                return (
                  <button key={s} type="button" onClick={() => setSpecialties((p) => (on ? p.filter((x) => x !== s) : [...p, s]))}
                    className={cn('rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer', on ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50')}>
                    {SPECIALTY_LABELS[s]}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-gray-400">You can change these later from your profile.</p>
          </div>
        )}

        <label className="flex items-start gap-2.5 text-[13.5px] text-[#5f6368]">
          <input type="checkbox" checked={form.agree} onChange={(e) => set('agree', e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1a73e8]" />
          <span>I agree to the <Link href="/terms" className="text-[#1a73e8] hover:underline" target="_blank">terms</Link> and <Link href="/privacy" className="text-[#1a73e8] hover:underline" target="_blank">privacy policy</Link>.</span>
        </label>

        {err && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{err}</p>}

        <button type="submit" disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-7 py-3 text-[15px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50 cursor-pointer">
          {loading ? 'Creating your account…' : (isAgent ? 'Create account & build my website' : 'Create account & open my workspace')}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>
    </div>
  );
}
