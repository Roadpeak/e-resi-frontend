'use client';

import { useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * White accordion row on the warm ground, matching the reference's FAQ.
 * Uses a real button + region rather than <details> so the open state can be
 * animated and the chevron rotated.
 */
export function AccordionItem({
  question,
  children,
  defaultOpen = false,
}: {
  question: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-6 px-6 py-5 text-left"
      >
        <span className="text-[16px] font-medium text-ink">{question}</span>
        <svg
          viewBox="0 0 20 20"
          className={cn(
            'h-4 w-4 shrink-0 text-ink/45 transition-transform duration-300',
            open && 'rotate-180',
          )}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 8l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 text-[16px] leading-relaxed text-ink/60">{children}</div>
        </div>
      </div>
    </div>
  );
}
