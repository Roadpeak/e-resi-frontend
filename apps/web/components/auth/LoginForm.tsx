'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Input } from '../ui/Input';
import { authApi } from '../../lib/api/auth';
import { useAuthStore } from '../../lib/stores/auth.store';
import { ApiError } from '../../lib/api/client';
import { VerificationCodePanel } from './VerificationCodePanel';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  /** Set when login is refused only because the email is unverified. */
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  /** Shown after returning from verification, so the trip is acknowledged. */
  const [verifiedNotice, setVerifiedNotice] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      const { accessToken, user } = await authApi.login(values);
      setUser(user, accessToken);
      // Return to the page that sent us here (internal paths only), else by role
      const redirect = searchParams.get('redirect');
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        router.push(redirect);
      } else if (user.role === 'DEVELOPER' || user.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/account');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Accounts created while email delivery was down never received their
        // code. Rather than a dead-end error, drop straight into verification
        // — the API tags this case so we are not string-matching a message
        // that could be reworded.
        const body = err.body as { code?: string; email?: string } | null;
        if (body?.code === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(body.email ?? values.email);
          return;
        }
        setServerError(err.message);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  }

  // Verification takes over the card entirely: the person cannot get in until
  // it is done, so showing the password form alongside it would only invite
  // them to retry something that will fail again.
  if (unverifiedEmail) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f0f4f9] px-4 py-10 font-google text-[#202124]">
        <div className="w-full max-w-[480px]">
          <div className="rounded-[28px] bg-white p-8 sm:p-10">
            <Link href="/" aria-label="e-resi home" className="inline-block">
              <Logo markSize={32} textClassName="text-gray-900 text-[1.4rem]" />
            </Link>
            <h1 className="mt-6 text-[26px] font-normal text-[#202124]">
              Verify your email
            </h1>
            <p className="mt-2 mb-6 text-[15px] leading-relaxed text-[#5f6368]">
              Your account was created but never verified. We&apos;ve sent a code to{' '}
              <span className="font-medium text-[#202124]">{unverifiedEmail}</span> — enter
              it below to finish setting up and sign in.
            </p>

            <VerificationCodePanel
              email={unverifiedEmail}
              autoSend
              title="Email verification"
              onVerified={() => {
                // Back to the form with the email intact, so signing in is a
                // password away rather than a fresh start.
                setUnverifiedEmail(null);
                setServerError('');
                setVerifiedNotice(true);
              }}
            />

            <button
              type="button"
              onClick={() => setUnverifiedEmail(null)}
              className="text-[14px] font-medium text-[#1a73e8] hover:text-[#1765cc] transition-colors cursor-pointer"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f0f4f9] px-4 py-10 font-google text-[#202124]">
      <div className="w-full max-w-[960px]">
        <div className="rounded-[28px] bg-white p-8 sm:p-12">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-10 md:grid-cols-2 md:gap-16">
            {/* ── Left: identity ── */}
            <div>
              <Link href="/" aria-label="e-resi home" className="inline-block">
                <Logo markSize={32} textClassName="text-gray-900 text-[1.4rem]" />
              </Link>
              <h1 className="mt-6 text-[2.5rem] font-normal leading-tight text-[#202124]">Sign in</h1>
              <p className="mt-2 text-base text-[#202124]">to continue to e-resi</p>
            </div>

            {/* ── Right: form ── */}
            <div className="flex flex-col justify-center">
              <div className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  className="border-[#dadce0] py-3 text-[15px] placeholder-[#80868b] focus:border-[#1a73e8] focus:ring-[#1a73e8]/20"
                  leftIcon={<Mail size={14} />}
                  error={errors.email?.message}
                  autoComplete="email"
                  {...register('email')}
                />

                <div>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="border-[#dadce0] py-3 text-[15px] placeholder-[#80868b] focus:border-[#1a73e8] focus:ring-[#1a73e8]/20"
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
                    error={errors.password?.message}
                    autoComplete="current-password"
                    {...register('password')}
                  />
                  <Link
                    href="/forgot-password"
                    className="mt-2 inline-block text-sm font-medium text-[#1a73e8] hover:text-[#1765cc] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {verifiedNotice && (
                  <p className="rounded-xl bg-[#e6f4ea] px-3 py-2.5 text-sm text-[#188038]">
                    Email verified — sign in to continue.
                  </p>
                )}

                {serverError && (
                  <p className="rounded-xl bg-[#fce8e6] px-3 py-2.5 text-sm text-[#c5221f]">
                    {serverError}
                  </p>
                )}

                <p className="text-sm leading-relaxed text-[#5f6368]">
                  Not your device? Use a private browsing window to sign in.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <Link
                  href="/register"
                  className="rounded-full px-3 py-2 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f0f4f9] transition-colors -ml-3"
                >
                  Create account
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-7 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  Sign in
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-4 flex items-center justify-between px-2 text-[13px] text-[#5f6368]">
          <span>e-resi · Immersive real estate</span>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-[#202124] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[#202124] transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
