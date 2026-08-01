'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthSplit } from './AuthSplit';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { authApi } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
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
      setSentEmail(values.email);
      setSent(true);
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
      image="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=90"
      quote="Secure access to your e-resi account — we'll have you back in moments."
      quoteAuthor="e-resi Account Security"
    >
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-10"
        >
          <ArrowLeft size={12} /> Back to Sign In
        </Link>

        {!sent ? (
          <>
            <h1 className="font-display font-light text-gray-900 text-3xl mb-1">Forgot password?</h1>
            <p className="text-sm text-gray-500 mb-8">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail size={14} />}
                autoComplete="email"
                autoFocus
                error={errors.email?.message}
                {...register('email')}
              />

              {serverError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {serverError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isSubmitting}
                icon={<ArrowRight size={16} />}
                iconPosition="right"
              >
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="flex h-16 w-16 mx-auto mb-6 items-center justify-center rounded-full bg-green-50 border border-green-200">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h1 className="font-display font-light text-gray-900 text-3xl mb-2">Link sent</h1>
            <p className="text-sm text-gray-500 mb-2">We sent a password reset link to</p>
            <p className="text-sm font-medium text-gray-900 mb-8">{sentEmail}</p>

            <p className="text-xs text-gray-500 mb-6">
              Didn&apos;t receive it? Check your spam folder or{' '}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
              >
                try again
              </button>
            </p>

            <Button href="/login" variant="secondary" className="w-full">
              Back to Sign In
            </Button>
          </div>
        )}
      </div>
    </AuthSplit>
  );
}
