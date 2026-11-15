'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Hand, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Home3D } from '../../lib/api/site';
import { ShowcaseErrorBoundary } from './ShowcaseErrorBoundary';

// three.js only loads in the browser, and only for pages that show a model.
const ModelCanvas = dynamic(() => import('./ModelCanvas'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-white/40" /></div>,
});

type View = 'exterior' | 'interior';

/**
 * Outside / inside 3D viewer. The canvas mounts only once the box nears the
 * screen, so the homepage does not pay for three.js up front. On a computer
 * the model takes the mouse wheel while the pointer is over it; on a phone,
 * a tap starts it so swiping past still scrolls the page.
 */
export function ModelShowcase({ config, className }: { config: Home3D; className?: string }) {
  const views = ([['exterior', 'Outside'], ['interior', 'Inside']] as const).filter(([k]) => config[k]);
  const [view, setView] = useState<View>(views[0]?.[0] ?? 'exterior');
  const [near, setNear] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);
  const [active, setActive] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTouchDevice(window.matchMedia('(hover: none)').matches);
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (views.length === 0) return null;
  const url = config[view]!;
  const other = views.find(([k]) => k !== view)?.[0];
  const interactive = !touchDevice || active;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* data-lenis-prevent: the wheel zooms the model instead of the page smooth-scrolling. */}
      <div ref={box} data-lenis-prevent className="relative h-[420px] overflow-hidden rounded-[28px] border-[1.5px] border-[#FFE345] sm:h-[520px] lg:h-full lg:min-h-[560px]">
        {/* Backstop: anything else the 3D view throws stays inside this box. */}
        {near && (
          <ShowcaseErrorBoundary key={url}>
            <ModelCanvas url={url} preload={other ? config[other] : null} interactive={interactive} />
          </ShowcaseErrorBoundary>
        )}

        {views.length > 1 && (
          <div role="tablist" aria-label="View" className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 rounded-full bg-black/45 p-1 backdrop-blur-md">
            {views.map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={view === k}
                onClick={() => setView(k)}
                className={cn(
                  'rounded-full px-5 py-2 font-google text-[13.5px] font-semibold transition-colors',
                  view === k ? 'bg-white text-[#14120a]' : 'text-white/80 hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {touchDevice && !active && near && (
          <button
            type="button"
            onClick={() => setActive(true)}
            className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent pb-5 pt-12 font-google text-[14px] font-medium text-white"
          >
            <Hand size={16} /> Tap to explore in 3D
          </button>
        )}
        {(!touchDevice || active) && (
          <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/40 px-3.5 py-1.5 font-google text-[12px] text-white/75 backdrop-blur-sm">
            Drag to turn · {touchDevice ? 'pinch' : 'scroll'} to zoom
          </p>
        )}
      </div>
      {config.caption && (
        <p className="mt-4 font-google text-[14px] text-stone/60">
          {config.link ? <Link href={config.link} className="hover:text-chalk">{config.caption} →</Link> : config.caption}
        </p>
      )}
    </div>
  );
}
