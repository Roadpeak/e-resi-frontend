'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Page numbers to show, collapsing long runs with an ellipsis. */
function pageItems(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push('gap');
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push('gap');

  items.push(total);
  return items;
}

export function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const go = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (next !== page) onChange(next);
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn('mt-10 flex items-center justify-center gap-1.5', className)}
    >
      <button
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200"
      >
        <ChevronLeft size={16} />
      </button>

      {pageItems(page, totalPages).map((item, i) =>
        item === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-gray-400">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => go(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'h-9 min-w-9 cursor-pointer rounded-full px-3 text-sm font-medium transition-colors',
              item === page
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:text-gray-900',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
