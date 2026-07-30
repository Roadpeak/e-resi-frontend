'use client';

import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'viewer3d', label: '3D Tour' },
  { id: 'floorplans', label: 'Floor Plans' },
  { id: 'units', label: 'Units' },
  { id: 'location', label: 'Location' },
  { id: 'construction', label: 'Progress' },
  { id: 'booking', label: 'Book' },
];

interface Props {
  has3D: boolean;
  hasVR: boolean;
  hasConstruction: boolean;
}

export function PropertyNav({ has3D, hasConstruction }: Props) {
  const [active, setActive] = useState('overview');

  const visible = sections.filter((s) => {
    if (s.id === 'viewer3d' && !has3D) return false;
    if (s.id === 'construction' && !hasConstruction) return false;
    return true;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    visible.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [visible]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="sticky top-[57px] z-40 border-b border-white/5 glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-hide">
          {visible.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className={cn(
                'shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-all cursor-pointer',
                active === section.id
                  ? 'text-white bg-white/10'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5',
              )}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
