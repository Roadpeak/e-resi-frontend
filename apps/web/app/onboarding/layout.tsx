import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '../../components/brand/Logo';

export const metadata: Metadata = {
  title: 'List your development',
  description: 'Developer onboarding — get your development live on e-resi.',
};

/** Pure light-mode shell — the onboarding flow does not follow the site theme. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="e-resi home">
              <Logo markSize={26} textClassName="text-gray-900 text-[1.2rem]" />
            </Link>
            <span className="h-5 w-px bg-gray-200" />
            <span className="text-sm text-gray-600">Become a developer</span>
          </div>
          <p className="text-sm text-gray-500">
            <span className="hidden sm:inline">Already onboarded? </span>
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 lg:py-12">
        {children}
      </main>
    </div>
  );
}
