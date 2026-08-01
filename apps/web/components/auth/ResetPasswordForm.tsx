'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { AuthSplit } from './AuthSplit';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { authApi } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(token, form.password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const checks = [
    { label: 'At least 8 characters', pass: form.password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(form.password) },
    { label: 'One number', pass: /[0-9]/.test(form.password) },
    { label: 'One special character', pass: /[^A-Za-z0-9]/.test(form.password) },
  ];

  return (
    <AuthSplit
      image="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=90"
      quote="Your security is our priority. Choose a strong password to protect your account."
      quoteAuthor="e-resi Account Security"
    >
      <div>
        {!done ? (
          <>
            <h1 className="font-display font-light text-gray-900 text-3xl mb-1">Reset password</h1>
            <p className="text-sm text-gray-500 mb-8">Choose a new secure password for your account.</p>

            {!token && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                No reset token found. Please use the link from your email.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New password"
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
                required
                minLength={8}
                autoComplete="new-password"
              />

              {form.password && (
                <div className="grid grid-cols-2 gap-1.5 -mt-1">
                  {checks.map(({ label, pass }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={cn('h-1.5 w-1.5 rounded-full shrink-0 transition-colors', pass ? 'bg-green-500' : 'bg-gray-300')} />
                      <span className={cn('text-[10px] transition-colors', pass ? 'text-green-600' : 'text-gray-400')}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Input
                label="Confirm password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={(e) => { setForm((f) => ({ ...f, confirm: e.target.value })); setError(''); }}
                leftIcon={<Lock size={14} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="cursor-pointer hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                error={error}
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                loading={loading}
                disabled={!checks.every((c) => c.pass) || !form.confirm || !token}
              >
                Set New Password
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="flex h-16 w-16 mx-auto mb-6 items-center justify-center rounded-full bg-green-50 border border-green-200">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h1 className="font-display font-light text-gray-900 text-3xl mb-2">Password updated</h1>
            <p className="text-sm text-gray-500 mb-8">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Button href="/login" className="w-full">
              Sign In
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          <Link href="/login" className="hover:text-gray-600 transition-colors">
            Back to Sign In
          </Link>
        </p>
      </div>
    </AuthSplit>
  );
}
