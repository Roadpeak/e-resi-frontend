import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '../../components/brand/Logo';
import { RequireAuth } from '../../components/auth/RequireAuth';

export const metadata: Metadata = {
  title: 'List your development',
  description: 'Developer onboarding — get your development live on e-resi.',
};

/** Pure light-mode shell — the onboarding flow does not follow the site theme. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" aria-label="e-resi home">
            <Logo markSize={28} textClassName="text-gray-900 text-[1.3rem]" />
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Save & exit
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <RequireAuth roles={['DEVELOPER', 'ADMIN']}>{children}</RequireAuth>
      </main>
    </div>
  );
}
