import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthCardSkeleton } from '../../../components/auth/AuthCard';
import { ResetPasswordForm } from '../../../components/auth/ResetPasswordForm';

export const metadata: Metadata = { title: 'Create a password' };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
