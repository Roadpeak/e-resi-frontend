import { useId } from 'react';
import { cn } from '../../lib/utils';

const BLUE = '#4A80F5';
const BLUE_DEEP = '#3457E0';
const BLUE_LIGHT = '#6E9AF8';

/** App-tile mark: an "e" living under a roof, on a blue gradient tile. */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  const gradientId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={BLUE} />
          <stop offset="1" stopColor={BLUE_DEEP} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill={`url(#${gradientId})`} />
      <path
        d="M15 27 L32 13 L49 27"
        fill="none"
        stroke="#fff"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="32"
        y="52"
        textAnchor="middle"
        fontFamily="var(--font-geist), ui-rounded, system-ui, sans-serif"
        fontSize="30"
        fontWeight="600"
        fill="#fff"
      >
        e
      </text>
    </svg>
  );
}

/**
 * "e-resi" wordmark — the hyphen is a small roof chevron in resi blue.
 * Text inherits currentColor; size it with a text-* / font-size class.
 * Set onDark for the lighter blue accent on dark grounds.
 */
export function Wordmark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <span
      className={cn('inline-flex items-center font-sans font-medium tracking-tight leading-none', className)}
      aria-label="e-resi"
    >
      <span aria-hidden="true">e</span>
      <svg
        viewBox="0 0 24 14"
        className="w-[0.52em] mx-[0.07em] -translate-y-[0.06em]"
        aria-hidden="true"
      >
        <path
          d="M4 11 L12 4 L20 11"
          fill="none"
          stroke={onDark ? BLUE_LIGHT : BLUE}
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span aria-hidden="true">resi</span>
    </span>
  );
}

/** Full lockup: tile mark + wordmark. */
export function Logo({
  markSize = 30,
  onDark = false,
  className,
  textClassName,
}: {
  markSize?: number;
  onDark?: boolean;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={markSize} />
      <Wordmark onDark={onDark} className={textClassName} />
    </span>
  );
}
