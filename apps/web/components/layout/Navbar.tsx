'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/stores/auth.store';
import { Logo } from '../brand/Logo';

const links = [
  { href: '/properties', label: 'Properties' },
  { href: '/properties?status=off_plan', label: 'Off-Plan' },
  { href: '/dashboard', label: 'Developers' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Initial GSAP entrance
  useEffect(() => {
    gsap.fromTo(navRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, delay: 0.5, ease: 'power3.out', clearProps: 'all' }
    );
  }, []);

  // Mobile menu animation
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    if (menuOpen) {
      gsap.fromTo(menu,
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', display: 'flex' }
      );
    } else {
      gsap.to(menu, {
        opacity: 0, y: -8, duration: 0.25, ease: 'power2.in',
        onComplete: () => gsap.set(menu, { display: 'none' }),
      });
    }
  }, [menuOpen]);

  return (
    <>
      <nav
        ref={navRef}
        style={{ opacity: 0 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-ink/90 backdrop-blur-xl border-b border-white/[0.06]'
            : 'bg-transparent',
        )}
      >
        <div className="flex h-16 sm:h-18 items-center justify-between px-6 sm:px-10 lg:px-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo markSize={30} onDark textClassName="text-chalk text-[1.35rem]" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'text-xs tracking-[0.15em] uppercase transition-colors duration-300',
                  pathname === l.href ? 'text-chalk' : 'text-stone/50 hover:text-chalk',
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-5">
            {isAuthenticated && user ? (
              <>
                <Link
                  href={user.role === 'DEVELOPER' || user.role === 'ADMIN' ? '/dashboard' : '/account'}
                  className="text-xs tracking-[0.15em] uppercase text-stone/50 hover:text-chalk transition-colors duration-300"
                >
                  {user.firstName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs tracking-[0.15em] uppercase text-stone/50 hover:text-chalk transition-colors duration-300 cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-xs tracking-[0.15em] uppercase text-stone/50 hover:text-chalk transition-colors duration-300">
                  Sign In
                </Link>
                <Link
                  href="/onboarding"
                  className="border border-chalk/15 text-chalk text-xs tracking-[0.12em] uppercase px-5 py-2.5 hover:bg-chalk/5 transition-all duration-300"
                >
                  List Property
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex flex-col gap-1.5 p-1 cursor-pointer"
            aria-label="Menu"
          >
            <span className={cn('block w-6 h-px bg-chalk transition-all duration-300', menuOpen && 'rotate-45 translate-y-[5px]')} />
            <span className={cn('block w-4 h-px bg-chalk/50 transition-all duration-300', menuOpen && 'opacity-0')} />
            <span className={cn('block w-6 h-px bg-chalk transition-all duration-300', menuOpen && '-rotate-45 -translate-y-[5px]')} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        ref={menuRef}
        className="fixed inset-x-0 top-16 z-40 bg-ink/95 backdrop-blur-xl border-b border-white/[0.06] flex-col px-6 py-8 gap-6 hidden"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setMenuOpen(false)}
            className="font-display font-light text-2xl text-chalk/80 hover:text-chalk transition-colors"
          >
            {l.label}
          </Link>
        ))}
        <div className="h-px bg-white/8 my-2" />
        <Link href="/login" onClick={() => setMenuOpen(false)} className="text-xs tracking-[0.15em] uppercase text-stone/50">Sign In</Link>
        <Link href="/onboarding" onClick={() => setMenuOpen(false)} className="border border-chalk/15 text-chalk text-xs tracking-[0.12em] uppercase px-5 py-3 text-center">List Property</Link>
      </div>
    </>
  );
}
