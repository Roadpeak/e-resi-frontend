'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/stores/auth.store';
import { Logo } from '../brand/Logo';
import { homePathFor } from '../../lib/auth/role-home';

const links = [
  { href: '/for-developers', label: 'For Developers' },
  { href: '/for-investors', label: 'For Investors' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Fixed marketing nav that starts transparent over the gradient hero and flips
 * to an opaque tinted bar once the hero has scrolled past. It never hides — only
 * the ground and the text colour change, over a 300ms transition.
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    // Flip a little before the hero fully clears so the bar is already solid by
    // the time light content slides under it.
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A route change with the menu open would otherwise leave it covering the page.
  useEffect(() => setMenuOpen(false), [pathname]);

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  const onDark = !scrolled && !menuOpen;

  return (
    <>
      <nav
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300',
          onDark
            ? 'bg-transparent border-b border-transparent'
            : 'border-b border-ink/[0.07] bg-[#f4f6fb]/95 backdrop-blur-md',
        )}
      >
        <div className="mx-auto flex h-20 max-w-screen-xl items-center justify-between px-6 sm:px-10 lg:px-16">
          <Link href="/" className="flex items-center gap-2">
            <Logo
              markSize={30}
              onDark={onDark}
              textClassName={cn(
                'text-[1.35rem] transition-colors duration-300',
                onDark ? 'text-white' : 'text-ink',
              )}
            />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-[14px] transition-colors duration-200',
                    onDark
                      ? active
                        ? 'font-medium text-white'
                        : 'text-white/70 hover:text-white'
                      : active
                        ? 'font-medium text-ink'
                        : 'text-ink/55 hover:text-ink',
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {isAuthenticated && user ? (
              <>
                <Link
                  href={homePathFor(user.role)}
                  className={cn(
                    'text-[14px] transition-colors duration-200',
                    onDark ? 'text-white/75 hover:text-white' : 'text-ink/60 hover:text-ink',
                  )}
                >
                  {user.firstName}
                </Link>
                <button
                  onClick={handleLogout}
                  className={cn(
                    'cursor-pointer text-[14px] transition-colors duration-200',
                    onDark ? 'text-white/75 hover:text-white' : 'text-ink/60 hover:text-ink',
                  )}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    'text-[14px] transition-colors duration-200',
                    onDark ? 'text-white/75 hover:text-white' : 'text-ink/60 hover:text-ink',
                  )}
                >
                  Sign In
                </Link>
                <Link
                  href="/onboarding"
                  className={cn(
                    'rounded-lg px-5 py-2.5 text-[14px] font-medium transition-colors duration-200',
                    onDark
                      ? 'border border-white/35 text-white hover:bg-white/10'
                      : 'bg-resi-600 text-white hover:bg-resi-700',
                  )}
                >
                  List a Property
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="cursor-pointer p-2 md:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span
              className={cn(
                'mb-1.5 block h-px w-6 transition-all duration-300',
                onDark ? 'bg-white' : 'bg-ink',
                menuOpen && 'translate-y-[7px] rotate-45',
              )}
            />
            <span
              className={cn(
                'mb-1.5 block h-px w-4 transition-all duration-300',
                onDark ? 'bg-white/60' : 'bg-ink/50',
                menuOpen && 'opacity-0',
              )}
            />
            <span
              className={cn(
                'block h-px w-6 transition-all duration-300',
                onDark ? 'bg-white' : 'bg-ink',
                menuOpen && '-translate-y-[7px] -rotate-45',
              )}
            />
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <div
        className={cn(
          'fixed inset-x-0 top-20 z-40 flex-col gap-1 border-b border-ink/[0.07] bg-[#f4f6fb] px-6 py-6 shadow-lg md:hidden',
          menuOpen ? 'flex' : 'hidden',
        )}
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setMenuOpen(false)}
            className="py-2 text-[17px] text-ink/75 transition-colors hover:text-ink"
          >
            {l.label}
          </Link>
        ))}
        <div className="my-3 h-px bg-ink/[0.07]" />
        <Link
          href="/login"
          onClick={() => setMenuOpen(false)}
          className="py-2 text-[15px] text-ink/60"
        >
          Sign In
        </Link>
        <Link
          href="/onboarding"
          onClick={() => setMenuOpen(false)}
          className="mt-2 rounded-lg bg-resi-600 px-5 py-3 text-center text-[15px] font-medium text-white"
        >
          List a Property
        </Link>
      </div>
    </>
  );
}
