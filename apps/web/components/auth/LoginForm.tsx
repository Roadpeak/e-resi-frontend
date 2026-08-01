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
        setServerError(err.message);
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-[960px]">
        <div className="rounded-[28px] border border-gray-200 bg-white p-8 sm:p-12 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-10 md:grid-cols-2 md:gap-16">
            {/* ── Left: identity ── */}
            <div>
              <Link href="/" aria-label="e-resi home" className="inline-block">
                <Logo markSize={32} textClassName="text-gray-900 text-[1.4rem]" />
              </Link>
              <h1 className="mt-6 text-[2rem] font-normal leading-tight text-gray-900">Sign in</h1>
              <p className="mt-2 text-[15px] text-gray-600">to continue to e-resi</p>
            </div>

            {/* ── Right: form ── */}
            <div className="flex flex-col justify-center">
              <div className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
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
                    className="mt-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {serverError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {serverError}
                  </p>
                )}

                <p className="text-xs leading-relaxed text-gray-500">
                  Not your device? Use a private browsing window to sign in.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <Link
                  href="/register"
                  className="rounded-full px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700 transition-colors -ml-3"
                >
                  Create account
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  Sign in
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-4 flex items-center justify-between px-2 text-xs text-gray-400">
          <span>e-resi · Immersive real estate</span>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
