'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/stores/auth.store';
import { Logo } from '../brand/Logo';
import { homePathFor } from '../../lib/auth/role-home';

const links = [
  { href: '/properties', label: 'Properties' },
  { href: '/properties?status=off_plan', label: 'Off-Plan' },
  { href: '/rent', label: 'Rent' },
  { href: '/dashboard', label: 'Developers' },
];

export function NavbarLight() {
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

  useEffect(() => {
    gsap.fromTo(navRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'power3.out', clearProps: 'all' }
    );
  }, []);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    if (menuOpen) {
      gsap.fromTo(menu, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out', display: 'flex' });
    } else {
      gsap.to(menu, { opacity: 0, y: -8, duration: 0.2, ease: 'power2.in', onComplete: () => gsap.set(menu, { display: 'none' }) });
    }
  }, [menuOpen]);

  return (
    <>
      <nav ref={navRef} style={{ opacity: 0 }} className="fixed top-0 left-0 right-0 z-50">
        <div className="flex h-16 items-center justify-between px-6 sm:px-10 lg:px-16">
          <Link href="/" className="flex items-center gap-2">
            <Logo markSize={28} textClassName="text-gray-800 text-[1.3rem]" />
          </Link>

          <div className="hidden md:flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs tracking-wide transition-all duration-200',
                  pathname === l.href
                    ? 'bg-white shadow-sm text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/60',
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <Link
                  href={homePathFor(user.role)}
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {user.firstName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/onboarding"
                  className="bg-gray-900 text-white text-xs px-5 py-2.5 rounded-full hover:bg-gray-700 transition-colors"
                >
                  List Property
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMenuOpen((v) => !v)} className="md:hidden p-2 cursor-pointer" aria-label="Menu">
            <span className={cn('block w-5 h-px bg-gray-800 mb-1.5 transition-all', menuOpen && 'rotate-45 translate-y-[7px]')} />
            <span className={cn('block w-3 h-px bg-gray-400 mb-1.5 transition-all', menuOpen && 'opacity-0')} />
            <span className={cn('block w-5 h-px bg-gray-800 transition-all', menuOpen && '-rotate-45 -translate-y-[7px]')} />
          </button>
        </div>
      </nav>

      <div ref={menuRef} className="fixed inset-x-0 top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-lg flex-col px-6 py-6 gap-4 hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-xl text-gray-700 hover:text-gray-900 transition-colors">
            {l.label}
          </Link>
        ))}
        <div className="h-px bg-gray-100 my-1" />
        <Link href="/login" onClick={() => setMenuOpen(false)} className="text-sm text-gray-500">Sign In</Link>
        <Link href="/onboarding" onClick={() => setMenuOpen(false)} className="bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full text-center">List Property</Link>
      </div>
    </>
  );
}
