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

  return (
    <div className="sticky top-16 z-40 -mx-4 border-b border-gray-200 bg-white/95 backdrop-blur-md sm:-mx-6">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={cn(
              'shrink-0 border-b-2 px-3 py-3.5 text-[14px] font-medium transition-colors',
              active === s.id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900',
            )}
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
