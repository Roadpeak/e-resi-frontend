'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, ArrowLeft,
  Building2, TrendingUp, Home, Check, Upload, X, Camera, Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '../brand/Logo';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { authApi } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';

type Role = 'developer' | 'investor' | 'tenant';

const ROLES: {
  id: Role;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  recommended?: boolean;
}[] = [
  {
    id: 'developer',
    label: 'Developer',
    sublabel: 'List & sell properties',
    icon: <Building2 size={22} />,
  },
  {
    id: 'investor',
    label: 'Investor / Buyer',
    sublabel: 'Buy & invest in property',
    icon: <TrendingUp size={22} />,
    recommended: true,
  },
  {
    id: 'tenant',
    label: 'Tenant',
    sublabel: 'Rent a home',
    icon: <Home size={22} />,
  },
];

// Map frontend role labels to backend Role enum
function toBackendRole(role: Role): 'DEVELOPER' | 'INVESTOR' | 'TENANT' {
  if (role === 'developer') return 'DEVELOPER';
  if (role === 'investor') return 'INVESTOR';
  return 'TENANT';
}

const WIZARD_STEPS = ['Account type', 'Your details', 'Verify email'];

type Step = 0 | 1 | 2;

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [role, setRole] = useState<Role | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    company: '',
    agreeTerms: false,
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
  }

  const selectedRole = ROLES.find((r) => r.id === role);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step !== 1) return;
    setServerError('');
    setLoading(true);
    try {
      await authApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role: toBackendRole(role!),
        companyName: role === 'developer' ? form.company || undefined : undefined,
      });
      setStep(2);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-google text-[#202124]">
      {/* ── Top bar ── */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#f1f3f4] px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="e-resi home">
            <Logo markSize={26} textClassName="text-gray-900 text-[1.2rem]" />
          </Link>
          <span className="h-5 w-px bg-[#dadce0]" />
          <span className="text-sm text-[#5f6368]">Create your account</span>
        </div>
        <p className="text-sm text-[#5f6368]">
          <span className="hidden sm:inline">Already have an account? </span>
          <Link href="/login" className="font-medium text-[#1a73e8] hover:text-[#1765cc] transition-colors">
            Sign in
          </Link>
        </p>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1">
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-12 px-5 py-8 sm:px-8 lg:py-12">
        {/* Step rail */}
        <nav aria-label="Registration progress" className="hidden w-44 shrink-0 lg:block pt-1.5">
          <ol className="space-y-5">
            {WIZARD_STEPS.map((label, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span className="flex w-4 items-center justify-center">
                    {done ? (
                      <Check size={15} strokeWidth={3} className="text-[#188038]" />
                    ) : (
                      <span className={cn('h-0.5 w-4 rounded-full', current ? 'bg-[#1a73e8]' : 'bg-[#dadce0]')} />
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-[13px]',
                      done && 'text-[#5f6368]',
                      current && 'font-medium text-[#202124]',
                      !done && !current && 'text-[#80868b]',
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Mobile progress */}
          <div className="mb-8 lg:hidden">
            <p className="mb-2 text-[13px] font-medium text-[#5f6368]">
              Step {step + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[step]}
            </p>
            <div className="h-1 w-full rounded-full bg-[#f1f3f4]">
              <div
                className="h-1 rounded-full bg-[#1a73e8] transition-all duration-300"
                style={{ width: `${((step + 1) / WIZARD_STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {step === 0 && (
              <motion.div
                key="step-role"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mx-auto max-w-2xl">
                  <h1 className="text-[28px] font-normal leading-snug text-[#202124] sm:text-[32px]">
                    How will you use e-resi?
                  </h1>
                  <p className="mt-2 text-[15px] text-[#5f6368]">
                    This can&apos;t be changed later.
                  </p>
                </div>

                <div className="mx-auto mt-8 max-w-2xl space-y-3">
                  {ROLES.map((r) => {
                    const selected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        aria-pressed={selected}
                        className={cn(
                          'flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-colors cursor-pointer',
                          selected
                            ? 'border-[#1a73e8] bg-[#f8fbff]'
                            : 'border-[#dadce0] bg-white hover:bg-[#f8f9fa]',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors',
                            selected ? 'bg-[#1a73e8] text-white' : 'bg-[#f1f3f4] text-[#5f6368]',
                          )}
                        >
                          {r.icon}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[16px] font-medium text-[#202124]">{r.label}</span>
                            {r.recommended && (
                              <span className="rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[11px] font-medium text-[#5f6368]">
                                Most common
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[14px] text-[#5f6368]">{r.sublabel}</span>
                        </span>

                        {/* A radio, not a tick — one of three, not a checklist. */}
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            selected ? 'border-[#1a73e8]' : 'border-[#dadce0]',
                          )}
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#1a73e8]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-xl"
              >
                <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-[#e8f0fe] px-3 py-1 text-[13px] font-medium text-[#1967d2]">
                  {selectedRole?.icon && <span className="[&>svg]:h-3 [&>svg]:w-3">{selectedRole.icon}</span>}
                  {selectedRole?.label}
                </div>

                <h1 className="text-[26px] font-normal leading-snug text-[#202124] sm:text-[32px]">Your details</h1>
                <p className="mt-2 text-base text-[#5f6368]">
                  {role === 'developer' ? 'Tell us about you and your company' : 'Set up your profile'}
                </p>

                <form id="register-details" onSubmit={handleSubmit} className="mt-8 space-y-4">
                  {/* Avatar / Logo upload */}
                  {role === 'developer' ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Company logo</p>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className={cn(
                          'relative w-full h-24 rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden cursor-pointer group',
                          logoPreview
                            ? 'border-brand-500/40 bg-transparent'
                            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
                        )}
                      >
                        {logoPreview ? (
                          <>
                            <Image src={logoPreview} alt="Logo preview" fill className="object-contain p-3" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera size={18} className="text-white" />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLogoPreview(null); if (logoInputRef.current) logoInputRef.current.value = ''; }}
                              className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white/70 hover:text-white cursor-pointer z-10"
                            >
                              <X size={10} />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full gap-1.5">
                            <Upload size={18} className="text-gray-400" />
                            <p className="text-xs text-gray-500">Click to upload logo</p>
                            <p className="text-[10px] text-gray-400">PNG, JPG, SVG — recommended 400×120px</p>
                          </div>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-all cursor-pointer group"
                        >
                          {avatarPreview ? (
                            <>
                              <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera size={14} className="text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <User size={20} className="text-gray-400" />
                            </div>
                          )}
                        </button>
                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={() => { setAvatarPreview(null); if (avatarInputRef.current) avatarInputRef.current.value = ''; }}
                            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-gray-300 text-gray-500 hover:text-gray-900 cursor-pointer"
                          >
                            <X size={8} />
                          </button>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-0.5">Profile photo</p>
                        <p className="text-xs text-gray-500">Optional · JPG or PNG, max 5MB</p>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="mt-1.5 text-xs text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
                        >
                          {avatarPreview ? 'Change photo' : 'Upload photo'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="First name"
                      placeholder="John"
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      leftIcon={<User size={13} />}
                      required
                      autoComplete="given-name"
                    />
                    <Input
                      label="Last name"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      required
                      autoComplete="family-name"
                    />
                  </div>

                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    leftIcon={<Mail size={14} />}
                    required
                    autoComplete="email"
                  />

                  <Input
                    label="Phone number"
                    type="tel"
                    placeholder="+254 700 000 000"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    leftIcon={<Phone size={14} />}
                    autoComplete="tel"
                  />

                  {role === 'developer' && (
                    <Input
                      label="Company / Developer name"
                      placeholder="Pristine Developments Ltd"
                      value={form.company}
                      onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                      leftIcon={<Building2 size={14} />}
                      required
                    />
                  )}

                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    leftIcon={<Lock size={14} />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="cursor-pointer hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    }
                    hint="Use 8+ characters with a mix of letters, numbers & symbols"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />

                  <PasswordStrength password={form.password} />

                  <label className="flex items-start gap-2.5 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={form.agreeTerms}
                      onChange={(e) => setForm((f) => ({ ...f, agreeTerms: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#dadce0] bg-white accent-[#1a73e8] cursor-pointer"
                      required
                    />
                    <span className="text-[13px] text-[#5f6368] leading-relaxed">
                      I agree to the{' '}
                      <Link href="/terms" className="text-[#1a73e8] hover:text-[#1765cc]">Terms of Service</Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-[#1a73e8] hover:text-[#1765cc]">Privacy Policy</Link>
                    </span>
                  </label>

                  {serverError && (
                    <p className="text-sm text-[#c5221f] bg-[#fce8e6] rounded-xl px-3 py-2.5">
                      {serverError}
                    </p>
                  )}
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-verify"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="mx-auto max-w-md text-center"
              >
                <div className="flex h-16 w-16 mx-auto mb-6 items-center justify-center rounded-full bg-[#e8f0fe]">
                  <Mail size={28} className="text-[#1a73e8]" />
                </div>
                <h1 className="text-[26px] font-normal leading-snug text-[#202124] sm:text-[32px] mb-2">Check your inbox</h1>
                <p className="text-sm text-gray-500 mb-2">
                  We&apos;ve sent a verification link to
                </p>
                <p className="text-sm font-medium text-gray-900 mb-6">{form.email || 'your email'}</p>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">What happens next</p>
                  <div className="space-y-2.5">
                    {[
                      'Click the link in your email to verify your account',
                      role === 'developer' ? 'Submit your KYB documents for developer verification' : 'Complete your profile to unlock all features',
                      `Access your ${role === 'developer' ? 'developer dashboard' : role === 'investor' ? 'investment portfolio' : 'rental dashboard'}`,
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[10px] font-bold text-[#1967d2] mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <VerificationCodePanel email={form.email} />

                <Button href="/login" variant="secondary" className="w-full">
                  Back to Sign In
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Footer actions (wizard steps only) ── */}
          {step < 2 && (
            <div
              className={cn(
                'mx-auto mt-10 flex items-center justify-between border-t border-gray-200 pt-6',
                step === 0 ? 'max-w-2xl' : 'max-w-xl',
              )}
            >
              <Link href="/" className="text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc] transition-colors">
                Cancel
              </Link>
              <div className="flex items-center gap-3">
                {step === 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] bg-white px-6 py-2.5 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                )}
                {step === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!role) return;
                      // Developers sign up through the guided onboarding wizard
                      if (role === 'developer') router.push('/onboarding');
                      else setStep(1);
                    }}
                    disabled={!role}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-7 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Continue <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="register-details"
                    disabled={!form.agreeTerms || loading}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-7 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <>Creating account <Loader2 size={15} className="animate-spin" /></>
                    ) : (
                      <>Create account <ArrowRight size={15} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/*
        A single quiet image, only where there is genuinely room for it.
        Decorative, so hidden from assistive tech, and never rendered at
        widths where it would compete with the form.
      */}
      <aside
        aria-hidden="true"
        className="relative hidden w-[38%] max-w-[560px] shrink-0 overflow-hidden xl:block"
      >
        <Image
          src="/images/prop1.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 0px, 38vw"
          className="object-cover"
        />
        {/* Softens the join with the form and keeps the caption legible. */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-8">
          <p className="text-[15px] font-medium leading-snug text-white">
            Every development gets its own branded page — with cinematic, 3D and VR tours.
          </p>
        </div>
      </aside>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-[#ea4335]', 'bg-[#fa903e]', 'bg-[#f9ab00]', 'bg-[#34a853]'];

  return (
    <div className="space-y-1.5 -mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-all duration-300', i < score ? colors[score - 1] : 'bg-gray-200')}
          />
        ))}
      </div>
      <p className="text-[10px] text-gray-500">
        Strength: <span className="font-medium text-gray-700">{labels[score - 1] ?? 'Too short'}</span>
      </p>
    </div>
  );
}

// ── Email verification code panel (shown on the final register step) ─────────

function VerificationCodePanel({ email }: { email: string }) {
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    setNotice(null);
    setSending(true);
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
    setError(null);
    setNotice(null);
    setVerifying(true);
    try {
      await authApi.verifyCode(email, code.trim());
      setVerified(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid or expired verification code');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left mb-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC status:</p>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
            verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
          )}
        >
          {verified && <Check size={12} strokeWidth={3} />}
          {verified ? 'Verified' : 'Pending verification'}
        </span>
      </div>

      {verified ? (
        <p className="text-sm text-gray-600">
          Your email is verified. You can now sign in to your account.
        </p>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            loading={sending}
            onClick={handleSend}
          >
            {sent ? 'Resend verification code' : 'Send verification code'}
          </Button>

          <div className="flex items-end gap-2">
            <Input
              label="Verification code"
              placeholder="6-digit code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              wrapperClassName="flex-1"
            />
            <Button
              type="button"
              loading={verifying}
              disabled={code.length !== 6}
              onClick={handleVerify}
            >
              Verify
            </Button>
          </div>

          {notice && <p className="mt-3 text-xs text-emerald-600">{notice}</p>}
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}
