'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BadgeCheck, Loader2, MailWarning } from 'lucide-react';
import { AuthCard } from './AuthCard';
import { authApi } from '../../lib/api/auth';

type State = 'verifying' | 'success' | 'error';

const primaryBtn =
  'rounded-full bg-[#1a73e8] px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc]';
const quietBtn =
  '-ml-3 rounded-full px-3 py-2 text-[15px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f0f4f9]';

export function VerifyEmailView() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState<State>('verifying');
  // Verification tokens are single-use, and StrictMode runs effects twice in
  // development — without this the second call consumes an already-spent token
  // and reports failure for a verification that actually succeeded.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setState('error');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [token]);

  if (state === 'verifying') {
    return (
      <AuthCard title="Verifying" subtitle="Confirming your email address">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f0fe]">
          <Loader2 size={24} className="animate-spin text-[#1a73e8]" />
        </div>
        <p className="mt-6 text-[15px] leading-relaxed text-[#5f6368]">
          This only takes a moment.
        </p>
      </AuthCard>
    );
  }

  if (state === 'success') {
    return (
      <AuthCard title="Email verified" subtitle="Your e-resi account is ready">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f4ea]">
          <BadgeCheck size={24} className="text-[#188038]" />
        </div>
        <p className="mt-6 text-[15px] leading-relaxed text-[#5f6368]">
          You can start touring developments, or head to your dashboard.
        </p>
        <div className="mt-8 flex items-center justify-between">
          <Link href="/properties" className={quietBtn}>
            Browse properties
          </Link>
          <Link href="/dashboard" className={primaryBtn}>
            Go to dashboard
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="This link has expired" subtitle="to verify your email address">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fef7e0]">
        <MailWarning size={24} className="text-[#b06000]" />
      </div>
      <p className="mt-6 text-[15px] leading-relaxed text-[#5f6368]">
        Verification links are single-use and expire after a short time. Sign in and
        we&apos;ll send you a fresh one.
      </p>
      <div className="mt-8 flex items-center justify-between">
        <Link href="/register" className={quietBtn}>
          Create an account
        </Link>
        <Link href="/login" className={primaryBtn}>
          Sign in
        </Link>
      </div>
    </AuthCard>
  );
}
