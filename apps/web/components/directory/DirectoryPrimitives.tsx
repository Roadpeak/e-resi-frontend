'use client';

import Link from 'next/link';
import { cn } from '../../lib/utils';

/**
 * Shared visual language for the directory-style pages (Top Developers, the
 * developer profile, Map/Locations) — modelled on a reference design of a
 * light gray canvas with floating white panels, black pill actions, and
 * pastel metadata tags. Deliberately not reused elsewhere: the rest of the
 * app uses the Google-inspired system (blue primary, #dadce0 borders), and
 * mixing the two within one page would look like two different products.
 */

/** The page-level gray canvas every directory page sits on. */
export function DirectoryShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-h-screen bg-[#f0f0f2]', className)}>
      {children}
    </div>
  );
}

/** A floating white panel — the base unit of the reference layout. */
export function DirectoryCard({
  children,
  className,
  as: Component = 'div',
  href,
}: {
  children?: React.ReactNode;
  className?: string;
  as?: 'div' | 'article';
  href?: string;
}) {
  const cls = cn('rounded-[28px] bg-white', className);
  if (href) {
    return (
      <Link href={href} className={cn(cls, 'block transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]')}>
        {children}
      </Link>
    );
  }
  const Comp = Component;
  return <Comp className={cls}>{children}</Comp>;
}

const TAG_TONES = {
  green: 'bg-[#e3f5e9] text-[#1a7d43]',
  blue: 'bg-[#e4eefb] text-[#1a5fa8]',
  orange: 'bg-[#fdecd9] text-[#b56417]',
  purple: 'bg-[#ece3fb] text-[#6b3fb0]',
  gray: 'bg-[#f1f1f3] text-[#5c5c63]',
} as const;

/** Small pastel metadata chip — price, category, location, status. */
export function Tag({
  children,
  tone = 'gray',
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TAG_TONES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium',
        TAG_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Near-black primary action — the reference design's one consistent CTA. */
export function PillButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-[#111112] px-5 py-2.5',
        'text-[14px] font-medium text-white transition-colors hover:bg-[#2a2a2c]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PillLink({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-[#111112] px-5 py-2.5',
        'text-[14px] font-medium text-white transition-colors hover:bg-[#2a2a2c]',
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Secondary, outlined pill — used for icon-only actions like call/WhatsApp. */
export function IconPillLink({
  href,
  label,
  children,
  tone = 'default',
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  tone?: 'default' | 'whatsapp';
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      title={label}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
        tone === 'whatsapp'
          ? 'border-[#25d366]/30 bg-[#e9faf0] text-[#1fa855] hover:bg-[#d8f5e3]'
          : 'border-black/10 bg-[#f5f5f6] text-[#111112] hover:bg-[#eaeaec]',
      )}
    >
      {children}
    </a>
  );
}
