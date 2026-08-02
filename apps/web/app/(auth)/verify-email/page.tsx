import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthCardSkeleton } from '../../../components/auth/AuthCard';
import { VerifyEmailView } from '../../../components/auth/VerifyEmailView';

export const metadata: Metadata = { title: 'Verify email' };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <VerifyEmailView />
    </Suspense>
  );
}
