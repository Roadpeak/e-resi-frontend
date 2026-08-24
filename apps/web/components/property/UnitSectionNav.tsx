'use client';

import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * The section rail on a unit page.
 *
 * A unit page is long — gallery, specs, layout, tour, features — and a buyer
 * comparing two apartments wants the floor plan, not a scroll. This pins under
 * the topbar and marks where they are.
 *
 * It highlights by scroll position rather than by `:target`, because a hash
 * only changes when someone clicks: scrolling past a section would otherwise
 * leave the previous one lit, which reads as broken.
 */
export function UnitSectionNav({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    if (!sections.length) return;

    const spy = () => {
      // The section whose top has most recently passed under the nav wins.
      // Measured against a line below the chrome rather than the viewport top,
      // so the highlight changes when a heading reaches the rail.
      const line = 190;
      let current = sections[0].id;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      setActive(current);
    };

    spy();
    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy);
    return () => {
      window.removeEventListener('scroll', spy);
      window.removeEventListener('resize', spy);
    };
  }, [sections]);

  if (sections.length < 2) return null;

  /**
   * Matches PropertyNav: same offset, same width, same pill buttons.
   *
   * A unit page is part of the development's mini-site, and a visitor moving
   * between the property and one of its units should not feel the chrome
   * change shape under them — so this is the property nav's treatment rather
   * than a second style of its own.
   */
  return (
    <div className="sticky top-16 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="scrollbar-hide flex items-center gap-1 overflow-x-auto py-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className={cn(
                'shrink-0 cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                active === s.id
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
              )}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
