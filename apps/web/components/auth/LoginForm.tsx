'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { AuthSplit } from './AuthSplit';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
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
      // Redirect based on role
      if (user.role === 'DEVELOPER' || user.role === 'ADMIN') {
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
    <AuthSplit
      quote="The future of property search is immersive. Explore every detail before you decide."
      quoteAuthor="e-resi — Nairobi's immersive real estate platform"
    >
      <div>
        <h1 className="font-display font-light text-white text-3xl mb-1">Welcome back</h1>
        <p className="text-sm text-white/40 mb-8">Sign in to your e-resi account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail size={14} />}
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            leftIcon={<Lock size={14} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="cursor-pointer hover:text-white/70 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {serverError}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-white/20 bg-surface-800 accent-brand-500 cursor-pointer"
              />
              <span className="text-xs text-white/40">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full mt-2" size="lg" loading={isSubmitting} icon={<ArrowRight size={16} />} iconPosition="right">
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-white/8" />
          <span className="text-xs text-white/25">or continue with</span>
          <div className="h-px flex-1 bg-white/8" />
        </div>

        {/* Social */}
        <div className="grid grid-cols-2 gap-3">
          <SocialButton icon={<GoogleIcon />} label="Google" />
          <SocialButton icon={<AppleIcon />} label="Apple" />
        </div>

        <p className="text-center text-xs text-white/30 mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </AuthSplit>
  );
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5',
        'px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20',
        'transition-all duration-150 cursor-pointer',
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
