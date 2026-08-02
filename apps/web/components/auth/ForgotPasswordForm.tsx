'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, MailCheck } from 'lucide-react';
import { AuthCard, AuthError, authInputCls } from './AuthCard';
import { Input } from '../ui/Input';
import { authApi } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      await authApi.forgotPassword(values.email);
      setSentTo(values.email);
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
    }
  }

  // ── Sent ──
  if (sentTo) {
    return (
      <AuthCard
        title="Check your email"
        subtitle={<>We sent a reset link to <span className="font-medium">{sentTo}</span></>}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f0fe]">
          <MailCheck size={24} className="text-[#1a73e8]" />
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-[#5f6368]">
          The link expires in an hour. If it doesn&apos;t arrive within a few minutes,
          check your spam folder.
        </p>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSentTo('')}
            className="-ml-3 rounded-full px-3 py-2 text-[15px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f0f4f9]"
          >
            Use a different email
          </button>
          <Link
            href="/login"
            className="rounded-full bg-[#1a73e8] px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc]"
          >
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  // ── Request ──
  return (
    <AuthCard title="Password recovery" subtitle="to get back into your e-resi account">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            className={authInputCls}
            leftIcon={<Mail size={14} />}
            autoComplete="email"
            autoFocus
            error={errors.email?.message}
            {...register('email')}
          />

          {serverError && <AuthError>{serverError}</AuthError>}

          <p className="text-sm leading-relaxed text-[#5f6368]">
            We&apos;ll email you a link to choose a new password.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link
            href="/login"
            className="-ml-3 rounded-full px-3 py-2 text-[15px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f0f4f9]"
          >
            Back to sign in
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-[#1a73e8] px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-60"
          >
            {isSubmitting ? 'Sending…' : 'Send link'}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
