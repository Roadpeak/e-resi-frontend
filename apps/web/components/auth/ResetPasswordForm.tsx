'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { AuthCard, AuthError, authInputCls } from './AuthCard';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { authApi } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';

/**
 * Strength guidance. The API only requires 8 characters, so these read as
 * advice rather than gates — blocking submit on rules the server does not
 * enforce would reject passwords the account would happily accept.
 */
const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: '8 or more characters', test: (v) => v.length >= 8 },
  { label: 'An uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'A number', test: (v) => /[0-9]/.test(v) },
  { label: 'A symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');

  const met = RULES.filter((r) => r.test(form.password)).length;
  const longEnough = form.password.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('This link is missing its token. Open the link from your email again.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Those passwords don’t match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(token, form.password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Done ──
  if (done) {
    return (
      <AuthCard title="Password changed" subtitle="You can now sign in to e-resi">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f4ea]">
          <ShieldCheck size={24} className="text-[#188038]" />
        </div>
        <p className="mt-6 text-[15px] leading-relaxed text-[#5f6368]">
          Any other devices signed in to this account will need the new password.
        </p>
        <div className="mt-8 flex justify-end">
          <Link
            href="/login"
            className="rounded-full bg-[#1a73e8] px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc]"
          >
            Sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  // ── Missing token: nothing here can work, so say so instead of showing a dead form ──
  if (!token) {
    return (
      <AuthCard title="This link isn’t valid" subtitle="to reset your e-resi password">
        <p className="text-[15px] leading-relaxed text-[#5f6368]">
          The reset link is incomplete or has already been used. Request a new one —
          links expire an hour after they&apos;re sent.
        </p>
        <div className="mt-8 flex items-center justify-between">
          <Link
            href="/login"
            className="-ml-3 rounded-full px-3 py-2 text-[15px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f0f4f9]"
          >
            Back to sign in
          </Link>
          <Link
            href="/forgot-password"
            className="rounded-full bg-[#1a73e8] px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc]"
          >
            Get a new link
          </Link>
        </div>
      </AuthCard>
    );
  }

  // ── Set a new password ──
  return (
    <AuthCard title="Create a password" subtitle="for your e-resi account">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter a new password"
            className={authInputCls}
            value={form.password}
            onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setError(''); }}
            leftIcon={<Lock size={14} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="cursor-pointer transition-colors hover:text-gray-600"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
            required
            minLength={8}
            autoComplete="new-password"
            autoFocus
          />

          {form.password && (
            <div>
              <div className="flex gap-1.5" aria-hidden="true">
                {RULES.map((r, i) => (
                  <span
                    key={r.label}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i < met
                        ? met <= 2 ? 'bg-[#f9ab00]' : met === 3 ? 'bg-[#1a73e8]' : 'bg-[#188038]'
                        : 'bg-[#e8eaed]',
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-[13px] text-[#5f6368]">
                {longEnough
                  ? `Strength: ${met <= 2 ? 'fair' : met === 3 ? 'good' : 'strong'}${
                      met < 4 ? ' — add ' + RULES.filter((r) => !r.test(form.password))
                        .map((r) => r.label.toLowerCase()).join(', ') : ''
                    }`
                  : 'Use 8 or more characters'}
              </p>
            </div>
          )}

          {/* Only rendered once there is something to confirm, so the form stays quiet. */}
          {longEnough && (
            <Input
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter it again"
              className={authInputCls}
              value={form.confirm}
              onChange={(e) => { setForm((f) => ({ ...f, confirm: e.target.value })); setError(''); }}
              leftIcon={<Lock size={14} />}
              required
              autoComplete="new-password"
            />
          )}

          {error && <AuthError>{error}</AuthError>}
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
            disabled={loading || !longEnough || !form.confirm}
            className="rounded-full bg-[#1a73e8] px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save password'}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
