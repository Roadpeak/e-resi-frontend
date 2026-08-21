'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { TourMark, type TourKind } from './TourMarks';
import { cn } from '../../lib/utils';

/**
 * The three immersive tours, presented at the size they deserve.
 *
 * They previously sat as 12px icons in small pills beside the booking button —
 * the same visual weight as a filter chip, for the thing a developer paid six
 * figures to produce and the reason a buyer is on the page at all.
 */

interface TourDef {
  kind: TourKind;
  label: string;
  note: string;
  href: (slug: string) => string;
  /** Own accent, so the three read as distinct offerings rather than a set. */
  accent: string;
  tint: string;
}

const TOURS: Record<TourKind, TourDef> = {
  cinematic: {
    kind: 'cinematic',
    label: 'Cinematic tour',
    note: 'A film of the development that plays as you scroll.',
    href: (slug) => `/${slug}/tour/cinematic`,
    accent: '#a8712f',
    tint: 'rgba(168,113,47,0.08)',
  },
  '3d': {
    kind: '3d',
    label: '3D walkthrough',
    note: 'Move through it room by room, at your own pace.',
    href: (slug) => `/${slug}/tour/3d`,
    accent: '#1a73e8',
    tint: 'rgba(26,115,232,0.08)',
  },
  vr: {
    kind: 'vr',
    label: 'VR tour',
    note: 'Stand inside a unit at full scale, with a headset.',
    href: (slug) => `/${slug}/tour/vr`,
    accent: '#7c4dff',
    tint: 'rgba(124,77,255,0.08)',
  },
};

export function TourCards({
  propertySlug,
  has3D,
  hasVR,
  hasCinematic,
  /** Dark grounds need their own text and borders. */
  onDark = false,
  className,
}: {
  propertySlug: string;
  has3D?: boolean;
  hasVR?: boolean;
  hasCinematic?: boolean;
  onDark?: boolean;
  className?: string;
}) {
  // Cinematic first: it is the one that needs no equipment and no effort, so
  // it is the tour most visitors will actually take.
  const available: TourKind[] = [
    ...(hasCinematic ? (['cinematic'] as const) : []),
    ...(has3D ? (['3d'] as const) : []),
    ...(hasVR ? (['vr'] as const) : []),
  ];

  if (available.length === 0) return null;

  return (
    <div
      className={cn(
        'grid gap-3',
        available.length === 1 ? 'sm:grid-cols-1' : available.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3',
        className,
      )}
    >
      {available.map((kind) => {
        const t = TOURS[kind];
        return (
          <Link
            key={kind}
            href={t.href(propertySlug)}
            className={cn(
              'group relative flex items-start gap-4 overflow-hidden rounded-2xl border p-5 transition-colors',
              onDark
                ? 'border-white/12 bg-white/[0.03] hover:border-white/25'
                : 'border-neutral-200 bg-white hover:border-neutral-300',
            )}
          >
            {/* A wash of the tour's own colour, so the three are told apart at
                a glance without three loud cards. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: t.tint }}
            />

            <span
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: t.tint, color: t.accent }}
            >
              <TourMark kind={kind} size={30} />
            </span>

            <span className="relative min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'text-[15px] font-semibold',
                    onDark ? 'text-white' : 'text-neutral-900',
                  )}
                >
                  {t.label}
                </span>
                <ArrowUpRight
                  size={14}
                  className={cn(
                    'shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                    onDark ? 'text-white/45' : 'text-neutral-400',
                  )}
                />
              </span>
              <span
                className={cn(
                  'mt-1 block text-[13px] leading-relaxed',
                  onDark ? 'text-white/55' : 'text-neutral-500',
                )}
              >
                {t.note}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
