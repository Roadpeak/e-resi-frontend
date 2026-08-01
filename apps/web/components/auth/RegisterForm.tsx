'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight,
  Building2, TrendingUp, Home, Check, Upload, X, Camera,
} from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthSplit } from './AuthSplit';
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
  description: string;
  features: string[];
  image: string;
  quote: string;
}[] = [
  {
    id: 'developer',
    label: 'Developer',
    sublabel: 'List & sell properties',
    icon: <Building2 size={20} />,
    description: 'List developments, manage units, publish cinematic and 3D tours, and track inquiries.',
    features: ['Property listings & management', 'Cinematic & 3D tour publishing', 'Inquiry & booking management', 'Sales analytics dashboard', 'Rent listing management'],
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&q=90',
    quote: 'Reach serious buyers with immersive experiences that close deals faster.',
  },
  {
    id: 'investor',
    label: 'Investor / Buyer',
    sublabel: 'Buy & invest in property',
    icon: <TrendingUp size={20} />,
    description: 'Browse off-plan and completed properties, take virtual tours, track investments, and make informed purchase decisions.',
    features: ['Full VR & 3D tour access', 'Saved properties & shortlists', 'Investment yield tracking', 'Direct developer inquiries', 'Early access to off-plan launches'],
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1400&q=90',
    quote: 'Tour every property from your screen — and invest with confidence.',
  },
  {
    id: 'tenant',
    label: 'Tenant',
    sublabel: 'Rent a home',
    icon: <Home size={20} />,
    description: 'Find furnished and unfurnished rentals, tour units virtually, schedule viewings, and manage your lease.',
    features: ['Browse rental listings', 'Cinematic & 3D unit tours', 'Schedule viewings online', 'Rental application management', 'Lease document storage'],
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=90',
    quote: 'Find your next home before you leave yours — from anywhere in the world.',
  },
];

// Map frontend role labels to backend Role enum
function toBackendRole(role: Role): 'DEVELOPER' | 'INVESTOR' | 'TENANT' {
  if (role === 'developer') return 'DEVELOPER';
  if (role === 'investor') return 'INVESTOR';
  return 'TENANT';
}

const STEPS = ['Role', 'Details', 'Verify'];

type Step = 0 | 1 | 2;

export function RegisterForm() {
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

  function handleNext() {
    if (step === 0 && role) setStep(1);
  }

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
    <AuthSplit
      image={selectedRole?.image ?? ROLES[1].image}
      quote={selectedRole?.quote ?? 'Experience properties like never before.'}
      quoteAuthor={selectedRole ? `e-resi for ${selectedRole.label}s` : 'e-resi Platform'}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-all',
              i < step ? 'bg-brand-500 text-white' : i === step ? 'bg-brand-600 text-white ring-2 ring-brand-500/30' : 'bg-gray-100 text-gray-400',
            )}>
              {i < step ? <Check size={10} /> : i + 1}
            </div>
            <span className={cn('text-[10px] font-medium tracking-wide', i === step ? 'text-gray-600' : 'text-gray-400')}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200 mx-0.5" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step-role"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="font-display font-light text-gray-900 text-3xl mb-1">Create account</h1>
            <p className="text-sm text-gray-500 mb-6">How will you use e-resi?</p>

            <div className="space-y-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    'w-full rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer',
                    role === r.id
                      ? 'border-brand-500/50 bg-brand-600/10 ring-1 ring-brand-500/20'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
                      role === r.id ? 'bg-brand-600/20 text-brand-600' : 'bg-gray-100 text-gray-400',
                    )}>
                      {r.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn('font-semibold text-sm transition-colors', role === r.id ? 'text-gray-900' : 'text-gray-600')}>
                          {r.label}
                        </p>
                        {role === r.id && (
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500">
                            <Check size={9} className="text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{r.sublabel}</p>
                      {role === r.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 space-y-1.5 overflow-hidden"
                        >
                          {r.features.map((f) => (
                            <div key={f} className="flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-brand-400 shrink-0" />
                              <span className="text-[11px] text-gray-500">{f}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Button
              className="w-full mt-6"
              size="lg"
              disabled={!role}
              onClick={handleNext}
              icon={<ArrowRight size={16} />}
              iconPosition="right"
            >
              Continue
            </Button>

            <p className="text-center text-xs text-gray-400 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <span className="text-gray-300">·</span>
              <div className={cn(
                'flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border',
                'border-brand-500/20 bg-brand-500/10 text-brand-600',
              )}>
                {selectedRole?.icon && <span className="[&>svg]:w-3 [&>svg]:h-3">{selectedRole.icon}</span>}
                {selectedRole?.label}
              </div>
            </div>

            <h1 className="font-display font-light text-gray-900 text-3xl mb-1">Your details</h1>
            <p className="text-sm text-gray-500 mb-6">
              {role === 'developer' ? 'Tell us about you and your company' : 'Set up your profile'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

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
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-gray-300 bg-white accent-brand-500 cursor-pointer"
                  required
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-brand-600 hover:text-brand-700">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-brand-600 hover:text-brand-700">Privacy Policy</Link>
                </span>
              </label>

              {serverError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {serverError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                loading={loading}
                disabled={!form.agreeTerms}
                icon={<ArrowRight size={16} />}
                iconPosition="right"
              >
                Create Account
              </Button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-verify"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="flex h-16 w-16 mx-auto mb-6 items-center justify-center rounded-full bg-brand-600/20 border border-brand-500/20">
              <Mail size={28} className="text-brand-600" />
            </div>
            <h1 className="font-display font-light text-gray-900 text-3xl mb-2">Check your inbox</h1>
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
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-[10px] font-bold text-brand-600 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Didn&apos;t receive it?{' '}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await authApi.forgotPassword(form.email);
                  } catch {
                    // ignore
                  }
                }}
                className="text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
              >
                Resend email
              </button>
            </p>

            <Button href="/login" variant="secondary" className="w-full">
              Back to Sign In
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthSplit>
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
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

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
