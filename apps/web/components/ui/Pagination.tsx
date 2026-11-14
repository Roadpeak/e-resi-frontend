'use client';

import Link from 'next/link';
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

/**
 * Page controls. With `hrefBase`, every control is a real link to
 * `?page=N` (page 1 at the bare path), so crawlers can follow the pages and
 * the back button works; the parent follows the URL. Without it they are
 * in-page buttons calling `onChange`, for filtered views whose pages have
 * no URL of their own.
 */
export function Pagination({
  page,
  totalPages,
  onChange,
  hrefBase,
  className,
}: {
  page: number;
  totalPages: number;
  onChange?: (page: number) => void;
  hrefBase?: string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const go = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (next !== page) onChange?.(next);
  };
  const href = (p: number) => (p <= 1 ? hrefBase! : `${hrefBase}?page=${p}`);
  const navBtn = 'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200';
  const numCls = (active: boolean) => cn(
    'flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-medium transition-colors',
    active ? 'bg-gray-900 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:text-gray-900',
  );

  if (hrefBase) {
    return (
      <nav aria-label="Pagination" className={cn('mt-10 flex items-center justify-center gap-1.5', className)}>
        {page > 1
          ? <Link href={href(page - 1)} rel="prev" aria-label="Previous page" className={navBtn}><ChevronLeft size={16} /></Link>
          : <span aria-hidden className={cn(navBtn, 'cursor-not-allowed opacity-40')}><ChevronLeft size={16} /></span>}
        {pageItems(page, totalPages).map((item, i) =>
          item === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-gray-400">…</span>
          ) : (
            <Link key={item} href={href(item)} aria-current={item === page ? 'page' : undefined} className={numCls(item === page)}>
              {item}
            </Link>
          ),
        )}
        {page < totalPages
          ? <Link href={href(page + 1)} rel="next" aria-label="Next page" className={navBtn}><ChevronRight size={16} /></Link>
          : <span aria-hidden className={cn(navBtn, 'cursor-not-allowed opacity-40')}><ChevronRight size={16} /></span>}
      </nav>
    );
  }

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
