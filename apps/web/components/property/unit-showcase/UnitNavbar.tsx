'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Share2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useArrivedFromMarketplace } from '../../../lib/branding/use-arrived-from-marketplace';

/**
 * The navbar for a unit or layout page.
 *
 * One bar, not two: the development's identity on the left, the page's own
 * sections in the middle (with the current one marked as you scroll), and
 * share plus the booking call to action on the right. On a phone the
 * sections drop to a scrollable strip under the bar.
 *
 * It carries the development's brand rather than e-resi's — this is the link
 * a sales agent sends about one apartment — and only offers a way back to the
 * marketplace to visitors who came from there.
 */
export function UnitNavbar({
  propertySlug,
  propertyName,
  ownerName,
  logoUrl,
  sections,
  ctaLabel = 'Book a viewing',
}: {
  propertySlug: string;
  propertyName: string;
  ownerName?: string | null;
  logoUrl?: string | null;
  sections: { id: string; label: string }[];
  ctaLabel?: string;
}) {
  const fromMarketplace = useArrivedFromMarketplace(propertySlug);
  const [active, setActive] = useState(sections[0]?.id);
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const spy = () => {
      setScrolled(window.scrollY > 8);
      let current = sections[0]?.id;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 140) current = s.id;
      }
      setActive(current);
    };
    spy();
    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy);
    return () => {
      window.removeEventListener('scroll', spy);
      window.removeEventListener('resize', spy);
    };
  }, [sections]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  };

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* dismissed */
    }
  }

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 bg-white transition-shadow',
        scrolled ? 'shadow-[0_1px_0_rgba(0,0,0,0.08)]' : 'shadow-[0_1px_0_rgba(0,0,0,0.04)]',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
          {fromMarketplace && (
            <Link href="/properties" aria-label="All properties"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 sm:flex">
              <ArrowLeft size={17} />
            </Link>
          )}
          <Link href={`/${propertySlug}`} className="flex min-w-0 items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-black/[0.06]" />
            ) : (
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-medium"
                style={{ background: 'var(--brand, #18191a)', color: 'var(--brand-on, #fff)' }}>
                {propertyName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold leading-tight text-gray-900">{propertyName}</span>
              {ownerName && <span className="block truncate text-[12px] leading-tight text-gray-500">{ownerName}</span>}
            </span>
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="On this page">
          {sections.map((s) => (
            <button key={s.id} onClick={() => go(s.id)}
              className={cn(
                'relative px-3 py-5 text-[14px] transition-colors',
                active === s.id ? 'font-medium text-gray-900' : 'text-gray-500 hover:text-gray-900',
              )}>
              {s.label}
              {active === s.id && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full" style={{ background: 'var(--brand, #18191a)' }} />}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={share} aria-label="Share this page"
            className="flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium text-gray-700 hover:bg-gray-100">
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
          </button>
          <Link href={`/${propertySlug}#units`}
            className="hidden h-10 items-center rounded-full px-3 text-[14px] font-medium text-gray-700 hover:bg-gray-100 md:flex">
            All layouts
          </Link>
          <Link href={`/${propertySlug}#booking`}
            className="flex h-10 items-center rounded-full px-5 text-[14px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--brand, #18191a)', color: 'var(--brand-on, #fff)' }}>
            {ctaLabel}
          </Link>
        </div>
      </div>

      {sections.length > 1 && (
        <nav className="scrollbar-hide flex gap-1 overflow-x-auto border-t border-gray-100 px-3 lg:hidden" aria-label="On this page">
          {sections.map((s) => (
            <button key={s.id} onClick={() => go(s.id)}
              className={cn(
                'relative shrink-0 px-3 py-3 text-[13.5px]',
                active === s.id ? 'font-medium text-gray-900' : 'text-gray-500',
              )}>
              {s.label}
              {active === s.id && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full" style={{ background: 'var(--brand, #18191a)' }} />}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
