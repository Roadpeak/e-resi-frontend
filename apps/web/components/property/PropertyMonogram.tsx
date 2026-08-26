'use client';

import Image from 'next/image';
import { cn } from '../../lib/utils';

/**
 * A development's mark: its uploaded logo, or a monogram standing in for one.
 *
 * Most developers never upload a logo, so the placeholder is what the majority
 * of mini-sites actually show — in the navbar, the footer and anywhere the
 * development identifies itself. It was a filled square of the platform's blue
 * with two white letters in it, repeated in five places with the initials
 * recomputed inline each time. Two problems with that: a saturated blue tile is
 * the loudest object in a navbar that is otherwise the developer's own, and it
 * is the *platform's* blue, so it clashed with any developer whose brand was
 * not blue.
 *
 * This draws a quiet monogram instead — ink or white, hairline-ruled, on a
 * near-transparent wash of whatever colour the developer chose. It reads as a
 * mark rather than as a missing image, and it inherits branding rather than
 * fighting it.
 */

/** Up to two initials from a name, skipping words that carry no signal. */
export function initialsOf(name: string): string {
  const skip = new Set([
    'the', 'a', 'an', 'of', 'at', 'on', 'in', 'and', '&', 'by',
  ]);
  const words = (name ?? '')
    .split(/[\s\-–—]+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
    .filter((w, i, arr) => (arr.length > 1 ? !skip.has(w.toLowerCase()) : true));

  if (!words.length) return '—';
  if (words.length === 1) {
    // One word gives its first two letters — "Phoenix" reads better as "Ph"
    // than as a lone "P" floating in a box.
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function PropertyMonogram({
  name,
  logoUrl,
  size = 36,
  onDark = false,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  /** Rendered square, in px. */
  size?: number;
  /** Dark grounds invert the rule and the letterforms. */
  onDark?: boolean;
  className?: string;
}) {
  const radius = Math.round(size * 0.28);

  if (logoUrl) {
    return (
      <span
        className={cn('relative shrink-0 overflow-hidden bg-white ring-1 ring-black/5', className)}
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          className="object-contain p-[8%]"
          sizes={`${size}px`}
        />
      </span>
    );
  }

  const initials = initialsOf(name);

  return (
    <span
      aria-hidden
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden',
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        // A wash rather than a fill. At 8% the developer's colour is present
        // without the tile becoming the brightest thing on the bar.
        background: onDark
          ? 'rgba(255,255,255,0.08)'
          : 'color-mix(in srgb, var(--brand) 8%, white)',
        border: `1px solid ${
          onDark ? 'rgba(255,255,255,0.16)' : 'color-mix(in srgb, var(--brand) 22%, transparent)'
        }`,
      }}
    >
      {/* A hairline corner rule, so the mark reads as drawn rather than as a
          letter dropped in a box. Two strokes only — enough to suggest a
          frame, quiet enough to disappear at small sizes. */}
      <span
        className="pointer-events-none absolute"
        style={{
          left: '14%',
          top: '14%',
          width: '26%',
          height: '1px',
          background: onDark ? 'rgba(255,255,255,0.4)' : 'color-mix(in srgb, var(--brand) 45%, transparent)',
        }}
      />
      <span
        className="pointer-events-none absolute"
        style={{
          right: '14%',
          bottom: '14%',
          width: '26%',
          height: '1px',
          background: onDark ? 'rgba(255,255,255,0.4)' : 'color-mix(in srgb, var(--brand) 45%, transparent)',
        }}
      />
      <span
        style={{
          fontSize: Math.round(size * (initials.length > 1 ? 0.34 : 0.42)),
          // Light and tracked, the way a wordmark is set — not the bold
          // sans the old tile used.
          fontWeight: 500,
          letterSpacing: '0.06em',
          lineHeight: 1,
          color: onDark ? '#ffffff' : 'var(--brand)',
          fontFamily: 'var(--brand-font-heading)',
        }}
      >
        {initials}
      </span>
    </span>
  );
}
