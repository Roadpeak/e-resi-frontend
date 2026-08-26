'use client';

import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * One heading for every section of a mini-site.
 *
 * Before this, each section printed its own eyebrow and title with its own
 * classes, and they had drifted: the eyebrows rendered in five different
 * colours — gray, periwinkle, white, a blue and a purple — all doing the same
 * job, and the titles were uniformly `text-3xl font-semibold` whether the
 * section was the unit schedule or the weather chart. A page cannot read as
 * designed when the same element is styled five ways.
 *
 * Two rules hold it together:
 *
 * 1. **Colour comes from the developer.** The eyebrow uses `var(--brand)`, so a
 *    developer who picks maroon gets maroon. The old `text-brand-400` pointed
 *    at the *platform's* indigo-violet scale, which is why a page branded
 *    #1a73e8 blue was printing periwinkle labels and a violet booking button.
 *
 * 2. **Display type is light and tight.** Large headings take weight 400–500
 *    with negative tracking rather than 600 — the convention every premium
 *    property brand follows, and the thing that most separates an expensive
 *    page from a competent one. Bold headings shout; light ones at size carry
 *    authority.
 */

export type HeadingLevel = 'primary' | 'secondary';

export function SectionHeading({
  eyebrow,
  title,
  description,
  level = 'primary',
  align = 'left',
  onDark = false,
  actions,
  className,
}: {
  /** Small caps label above the title. Optional — not every section earns one. */
  eyebrow?: string;
  title: string;
  /** One or two lines under the title, for sections that need framing. */
  description?: string;
  /**
   * `primary` for the sections a buyer navigates to; `secondary` for reference
   * blocks that should not compete with them.
   */
  level?: HeadingLevel;
  align?: 'left' | 'center';
  onDark?: boolean;
  /** Right-aligned controls that belong to the section, e.g. a view toggle. */
  actions?: ReactNode;
  className?: string;
}) {
  const centred = align === 'center';

  return (
    <div
      className={cn(
        'mb-8',
        actions && !centred && 'flex flex-wrap items-end justify-between gap-4',
        className,
      )}
    >
      <div className={cn(centred && 'mx-auto max-w-2xl text-center')}>
        {eyebrow && (
          <p
            className={cn(
              'text-[11px] font-semibold uppercase tracking-[0.16em]',
              onDark && 'text-white/45',
            )}
            // The developer's colour, not the platform's.
            style={onDark ? undefined : { color: 'var(--brand)' }}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            'mt-3 text-balance',
            level === 'primary'
              ? 'text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.025em]'
              : 'text-[clamp(1.375rem,2vw,1.75rem)] font-medium leading-[1.15] tracking-[-0.02em]',
            onDark ? 'text-white' : 'text-gray-900',
          )}
          style={{ fontFamily: 'var(--brand-font-heading)' }}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-3 max-w-[58ch] text-[15px] leading-relaxed',
              centred && 'mx-auto',
              onDark ? 'text-white/55' : 'text-gray-500',
            )}
          >
            {description}
          </p>
        )}
      </div>
      {actions && !centred && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
