'use client';

import Link from 'next/link';
import { Logo } from '../brand/Logo';

/**
 * The two-column card the account screens share with sign-in: identity on the
 * left, the thing you actually came to do on the right. Collapses to a single
 * column below md, where the heading simply sits above the form.
 *
 * Sign-in builds its own because its columns live inside one <form>; everything
 * else — recovery, reset, verification — composes this.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  /** One line under the title. Kept short — this is not the place to explain policy. */
  subtitle: React.ReactNode;
  children: React.ReactNode;
  /** Replaces the default brand/legal row beneath the card. */
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f0f4f9] px-4 py-10 font-google text-[#202124]">
      <div className="w-full max-w-[960px]">
        <div className="rounded-[28px] bg-white p-8 sm:p-12">
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <Link href="/" aria-label="e-resi home" className="inline-block">
                <Logo markSize={32} textClassName="text-gray-900 text-[1.4rem]" />
              </Link>
              <h1 className="mt-6 text-[2.5rem] font-normal leading-tight text-[#202124]">
                {title}
              </h1>
              <p className="mt-2 text-base text-[#202124]">{subtitle}</p>
            </div>

            <div className="flex flex-col justify-center">{children}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-2 text-[13px] text-[#5f6368]">
          {footer ?? (
            <>
              <span>e-resi · Immersive real estate</span>
              <div className="flex gap-5">
                <Link href="/terms" className="transition-colors hover:text-[#202124]">Terms</Link>
                <Link href="/privacy" className="transition-colors hover:text-[#202124]">Privacy</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Suspense fallback for the screens that read search params. Those suspend on
 * the server, so without a fallback the server emits nothing while the client
 * mounts the whole card — React reports that as a hydration mismatch. Painting
 * the same surface also avoids a flash of empty background.
 */
export function AuthCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex min-h-screen w-full items-center justify-center bg-[#f0f4f9] px-4 py-10"
    >
      <div className="w-full max-w-[960px]">
        <div className="h-[292px] rounded-[28px] bg-white" />
      </div>
    </div>
  );
}

/** Shared input styling so these screens match sign-in exactly. */
export const authInputCls =
  'border-[#dadce0] py-3 text-[15px] placeholder-[#80868b] focus:border-[#1a73e8] focus:ring-[#1a73e8]/20';

/** Inline error, styled as Google's quiet red rather than an alarm. */
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-[#fce8e6] px-3 py-2.5 text-sm text-[#c5221f]">
      {children}
    </p>
  );
}
