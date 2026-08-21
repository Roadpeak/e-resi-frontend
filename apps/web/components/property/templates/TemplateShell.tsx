'use client';

import { SECTIONS } from '../../../lib/branding/theme';
import { surfaceTokens, type MiniSiteTemplate } from '../../../lib/branding/templates';
import { Reveal } from './shared';

/**
 * Section chrome for a template.
 *
 * The section components themselves are untouched — this only decides the
 * ground they sit on, whether they get a heading, and how much air surrounds
 * them. That boundary is what lets all eight templates share one implementation
 * of units, bookings, tours and analytics.
 */

/** Human label for a section id, from the single list the dashboard also uses. */
function labelFor(id: string): string {
  return SECTIONS.find((s) => s.id === id)?.label ?? id;
}

/**
 * Sections that supply their own heading and spacing. Wrapping these in
 * template chrome would produce two headings for one block.
 */
/** Sections that span the viewport rather than the centred column. */
const FULL_BLEED = new Set(['tours']);

const SELF_TITLED = new Set(['overview', 'booking']);

/**
 * Alternating ground, so long pages have rhythm rather than one flat column.
 * Only applied by templates that ask for it — a page that alternates for no
 * reason reads as noise.
 */
function bandBackground(
  template: MiniSiteTemplate,
  index: number,
): string | undefined {
  if (!template.banded) return undefined;
  const t = surfaceTokens(template.surface);
  return index % 2 === 1 ? t.panel : undefined;
}

export function TemplateSection({
  id,
  index,
  template,
  children,
}: {
  id: string;
  index: number;
  template: MiniSiteTemplate;
  children: React.ReactNode;
}) {
  const tokens = surfaceTokens(template.surface);
  const band = bandBackground(template, index);
  const showHeading = template.sectionHeadings && !SELF_TITLED.has(id);

  // A full-bleed section brings its own ground and padding, and must not sit
  // inside this centred max-width shell — that is the very constraint it
  // exists to break out of.
  if (FULL_BLEED.has(id)) return <>{children}</>;

  return (
    <section
      // Only set the id here when the child does not provide its own — the
      // page decides that and passes `id` as undefined when it would clash.
      id={id || undefined}
      className="scroll-mt-24"
      style={band ? { background: band } : undefined}
    >
      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
          template.airy ? 'py-20 sm:py-28' : 'py-14 sm:py-16'
        }`}
      >
        {showHeading && (
          <Reveal className="mb-10">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--brand)' }}
            >
              {labelFor(id)}
            </p>
            <div
              className="mt-4 h-px w-full"
              style={{ background: tokens.border }}
            />
          </Reveal>
        )}
        <Reveal>{children}</Reveal>
      </div>
    </section>
  );
}
