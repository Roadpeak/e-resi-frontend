'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { AuthSplit } from './AuthSplit';
import { Button } from '../ui/Button';
import { authApi } from '../../lib/api/auth';

type State = 'verifying' | 'success' | 'error';

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<State>('verifying');

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [token]);

  return (
    <AuthSplit
      image="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&q=90"
      quote="One step away from your immersive real estate experience."
      quoteAuthor="e-resi Platform"
    >
      <div className="text-center">
        {state === 'verifying' && (
          <>
            <div className="flex h-16 w-16 mx-auto mb-6 items-center justify-center rounded-full bg-brand-600/15 border border-brand-500/20">
              <Loader2 size={28} className="text-brand-600 animate-spin" />
            </div>
            <h1 className="font-display font-light text-gray-900 text-3xl mb-2">Verifying…</h1>
            <p className="text-sm text-gray-500">Confirming your email address, please wait.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="flex h-16 w-16 mx-auto mb-6 items-center justify-center rounded-full bg-green-50 border border-green-200">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h1 className="font-display font-light text-gray-900 text-3xl mb-2">Email verified</h1>
            <p className="text-sm text-gray-500 mb-8">
              Your account is now active. Welcome to e-resi.
            </p>

            <div className="space-y-3">
              <Button href="/dashboard" className="w-full" size="lg">
                Go to Dashboard
              </Button>
              <Button href="/properties" variant="secondary" className="w-full" size="lg">
                Browse Properties
              </Button>
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="flex h-16 w-16 mx-auto mb-6 items-center justify-center rounded-full bg-red-50 border border-red-200">
              <XCircle size={28} className="text-red-600" />
            </div>
            <h1 className="font-display font-light text-gray-900 text-3xl mb-2">Link expired</h1>
            <p className="text-sm text-gray-500 mb-8">
              This verification link has expired or is invalid. Request a new one below.
            </p>

            <Button href="/register" variant="secondary" className="w-full mb-3">
              Back to Sign Up
            </Button>
            <p className="text-xs text-gray-400">
              Already verified?{' '}
              <Link href="/login" className="text-brand-600 hover:text-brand-700 transition-colors">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthSplit>
  );
}
