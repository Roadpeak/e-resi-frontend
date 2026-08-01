'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2, Check, Eye, EyeOff, Loader2, Lock, LogOut, Mail, Phone, ShieldCheck, User,
} from 'lucide-react';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { authApi } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';
import { useAuthStore } from '../../lib/stores/auth.store';
import { useOnboardingStore } from '../../lib/stores/onboarding.store';
import { SectionCard } from './ui';

/**
 * Onboarding step 2: create the developer account.
 *
 * Registers a DEVELOPER user, verifies the email with a 6-digit code, then
 * signs in automatically — so the rest of the wizard runs authenticated.
 * If the visitor is already a signed-in developer the step is a no-op summary.
 * Company name captured here is NOT asked again on the Company step.
 */
export function StepAccount({ onCompleted }: { onCompleted: () => void }) {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const patchCompany = useOnboardingStore((s) => s.patchCompany);
  const [phase, setPhase] = useState<'form' | 'verify'>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', company: '', password: '', agreeTerms: false,
  });

  // ── Already signed in ──
  if (isAuthenticated && user) {
    const isDeveloper = user.role === 'DEVELOPER' || user.role === 'ADMIN';
    return (
      <SectionCard
        title={isDeveloper ? 'You’re signed in' : 'Developer account required'}
        subtitle={
          isDeveloper
            ? 'This wizard will complete the developer profile for your account.'
            : 'This flow creates a developer profile, but you’re signed in with a different account type.'
        }
      >
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500">{user.email} · {user.role.toLowerCase()}</p>
            </div>
          </div>
          {isDeveloper ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <ShieldCheck size={13} /> Developer
            </span>
          ) : (
            <button
              type="button"
              onClick={() => useAuthStore.getState().logout()}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <LogOut size={13} /> Sign out & start over
            </button>
          )}
        </div>
        {isDeveloper && (
          <p className="text-sm text-gray-500">
            Press <span className="font-medium text-gray-700">Continue</span> to proceed with company verification.
          </p>
        )}
      </SectionCard>
    );
  }

  // ── Anonymous: register then verify ──
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role: 'DEVELOPER',
        companyName: form.company,
      });
      // company name is collected here once — reused on the Company step
      patchCompany({
        companyName: form.company,
        contactName: `${form.firstName} ${form.lastName}`.trim(),
        contactEmail: form.email,
        contactPhone: form.phone,
      });
      setPhase('verify');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerified() {
    // email verified → sign in silently and continue the wizard
    setLoading(true);
    setError('');
    try {
      const { accessToken, user: u } = await authApi.login({ email: form.email, password: form.password });
      setUser(u, accessToken);
      onCompleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed — try signing in manually.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {phase === 'form' ? (
        <motion.form
          key="account-form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          onSubmit={handleRegister}
        >
          <SectionCard
            title="Create your developer account"
            subtitle="One account for your whole company — you can invite teammates later."
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name" placeholder="John" leftIcon={<User size={13} />} required autoComplete="given-name"
                value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
              <Input
                label="Last name" placeholder="Doe" required autoComplete="family-name"
                value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <Input
              label="Work email" type="email" placeholder="you@company.com" leftIcon={<Mail size={14} />} required autoComplete="email"
              value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              label="Phone number" type="tel" placeholder="+254 700 000 000" leftIcon={<Phone size={14} />} autoComplete="tel"
              value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="Company / Developer name" placeholder="Pristine Developments Ltd" leftIcon={<Building2 size={14} />} required
              hint="Asked once — we won’t make you type it again"
              value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              leftIcon={<Lock size={14} />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="cursor-pointer hover:text-gray-600 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
              required minLength={8} autoComplete="new-password"
              value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox" required
                checked={form.agreeTerms}
                onChange={(e) => setForm((f) => ({ ...f, agreeTerms: e.target.checked }))}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-gray-300 bg-white accent-brand-500 cursor-pointer"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                I agree to the <a href="/terms" className="text-brand-600 hover:text-brand-700">Terms of Service</a> and{' '}
                <a href="/privacy" className="text-brand-600 hover:text-brand-700">Privacy Policy</a>
              </span>
            </label>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={!form.agreeTerms || loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? <>Creating account <Loader2 size={15} className="animate-spin" /></> : 'Create developer account'}
            </button>
            <p className="text-center text-xs text-gray-400">
              Already have a developer account?{' '}
              <a href="/login?redirect=%2Fonboarding" className="font-medium text-brand-600 hover:text-brand-700">Sign in</a>
            </p>
          </SectionCard>
        </motion.form>
      ) : (
        <motion.div
          key="account-verify"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          <SectionCard
            title="Verify your email"
            subtitle={`We need to confirm ${form.email} before continuing.`}
          >
            <InlineCodeVerify email={form.email} onVerified={handleVerified} busy={loading} />
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}
          </SectionCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InlineCodeVerify({ email, onVerified, busy }: { email: string; onVerified: () => void; busy: boolean }) {
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function handleSend() {
    setError(''); setNotice(''); setSending(true);
    try {
      const res = await authApi.sendVerificationCode(email);
      setSent(true);
      setNotice(res.message ?? 'Verification code sent — check your inbox.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send code. Try again.');
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    setError(''); setNotice(''); setVerifying(true);
    try {
      await authApi.verifyCode(email, code.trim());
      onVerified();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid or expired verification code');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={handleSend}
        disabled={sending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
      >
        {sending && <Loader2 size={14} className="animate-spin" />}
        {sent ? 'Resend verification code' : 'Email me a verification code'}
      </button>

      <div className="flex items-end gap-2">
        <Input
          label="Verification code" placeholder="6-digit code" inputMode="numeric" maxLength={6}
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} wrapperClassName="flex-1"
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={code.length !== 6 || verifying || busy}
          className={cn(
            'inline-flex h-[42px] items-center gap-2 rounded-full bg-gray-900 px-6 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer',
            'hover:bg-gray-700 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
          )}
        >
          {(verifying || busy) ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Verify
        </button>
      </div>

      {notice && <p className="text-xs text-emerald-600">{notice}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
