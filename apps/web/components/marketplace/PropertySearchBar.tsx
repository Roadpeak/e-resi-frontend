'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useFiltersStore } from '../../lib/stores/filters.store';
import { useProperties } from '../../lib/api/queries';
import Link from 'next/link';
import { cn } from '../../lib/utils';

export function PropertySearchBar({ bare = false }: { bare?: boolean }) {
  const { filters, setFilter } = useFiltersStore();
  const [localQuery, setLocalQuery] = useState(filters.query ?? '');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setFilter('query', localQuery || undefined), 300);
    return () => clearTimeout(t);
  }, [localQuery, setFilter]);

  const { data } = useProperties({ search: localQuery.length > 1 ? localQuery : undefined, limit: 4 });
  const suggestions = localQuery.length > 1 ? (data?.items ?? []) : [];

  return (
    <div className="relative flex-1">
      <div className={cn(
        bare
          ? 'flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all'
          : cn(
              'flex items-center gap-2.5 rounded-xl border bg-gray-50 px-4 py-2.5 transition-all',
              focused ? 'border-gray-300 bg-white shadow-sm' : 'border-gray-200',
            ),
      )}>
        <Search size={15} className="shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search location, development..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
        {localQuery && (
          <button onClick={() => { setLocalQuery(''); inputRef.current?.focus(); }} className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer">
            <X size={13} />
          </button>
        )}
      </div>

      {focused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/80 z-50">
          {suggestions.map((p) => (
            <Link
              key={p.id}
              href={`/${p.slug}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <Search size={12} className="text-gray-300 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400">{p.address.neighborhood}, {p.address.city}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
