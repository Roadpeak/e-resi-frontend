'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TemplateThumb } from './TemplateThumb';

/**
 * The real thing, small: the agent's own site rendered in a template,
 * scaled down to a card. A desktop-width page is loaded in an iframe and
 * shrunk with a transform, so what they see is exactly what they'd get.
 * The drawn thumbnail stands in until the page has loaded.
 */
const PAGE_W = 1280;
const PAGE_H = 800;

export function TemplateLivePreview({ k, className }: { k: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / PAGE_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const src = `/site/agent-preview?template=${encodeURIComponent(k)}`;

  return (
    <div ref={box} className={cn('group/preview relative aspect-[16/10] overflow-hidden rounded-2xl border border-[#e8eaed] bg-[#f1f3f4]', className)}>
      {!ready && <div className="absolute inset-0"><TemplateThumb k={k} /></div>}
      <iframe
        src={src}
        title={`${k} preview`}
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        onLoad={() => setReady(true)}
        className={cn('pointer-events-none absolute left-0 top-0 origin-top-left border-0 transition-opacity duration-300', ready ? 'opacity-100' : 'opacity-0')}
        style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})` }}
      />
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        aria-label="Open full preview"
        className="absolute right-2 top-2 flex h-7 items-center gap-1 rounded-full bg-white/90 px-2.5 text-[12px] font-medium text-[#202124] opacity-0 shadow-sm transition-opacity hover:bg-white group-hover/preview:opacity-100 focus:opacity-100"
      >
        Full size <ArrowUpRight size={12} />
      </a>
    </div>
  );
}
