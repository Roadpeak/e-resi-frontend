'use client';

import { usePropertyPaths } from '../../../../../../components/dashboard/PropertyBase';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../../../components/dashboard/MaterialIcon';
import { propertiesApi } from '../../../../../../lib/api/properties';
import { ApiError } from '../../../../../../lib/api/client';
import { PICKER_TEMPLATES, DEFAULT_TEMPLATE, type MiniSiteTemplate } from '../../../../../../lib/branding/templates';
import { draftFromProperty, previewSrcFor, type MiniSiteDraft } from '../../../../../../lib/branding/mini-site-draft';
import { revalidateMiniSite } from '../../../../../../lib/actions/revalidate-mini-site';
import { cn } from '../../../../../../lib/utils';

/**
 * Template gallery, laid out like a template marketplace: each template sits
 * inset on its own coloured backdrop, showing this development's real page
 * live and scrolling through on its own, with the name below and an Apply
 * pill beside it. Clicking a tile opens that template's customise page —
 * the only place the page can be scrolled and explored by hand.
 */

/** Desktop width each template is rendered at before being scaled into its tile. */
const FRAME_WIDTH = 1440;
/** Auto-scroll speed through the page, in page pixels per second. */
const SCROLL_SPEED = 240;
/** Pause at the top and bottom of each pass, in ms. */
const SCROLL_PAUSE = 1800;

/** Backdrop behind each template, chosen to sit well with its design. */
const MATS: Record<string, string> = {
  CLASSIC: '#cfdcf3',
  EDITORIAL: '#e8dfd2',
  CONFIDENT: '#d7e8dc',
  STATEMENT: '#f1d9c8',
  LUXE_DARK: '#3a2f27',
  SHOWCASE: '#dbe6f0',
  ARCHITECTURAL: '#d9d9d6',
  WARM_LUXE: '#a8673f',
  FRAME: '#e9ec6b',
  PRESTIGE: '#1d2a40',
  GALLERY: '#c9d7e6',
  ATELIER: '#e7e0d6',
  HORIZON: '#bfdcef',
  SKYLINE: '#f0c9a8',
  NOIR: '#2b2b2b',
  RIVOS: '#d4d8e3',
  HOMEVIA: '#c9a98f',
  AUREVANT: '#8a2a22',
  REAL: '#dfe3e6',
  LUXIQ: '#c8b6dd',
  RENOVATE: '#e9e66a',
  ACSAPTI: '#e8b7ae',
};

export default function TemplateGallery() {
  const { base } = usePropertyPaths();
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => propertiesApi.get(slug),
  });

  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [applying, setApplying] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'light' | 'dark'>('all');

  const saved: MiniSiteDraft | null = useMemo(() => (property ? draftFromProperty(property) : null), [property]);
  const liveKey = saved?.templateKey ?? DEFAULT_TEMPLATE;

  // The live template first, then the rest in picker order (newest first).
  const ordered = useMemo(() => {
    const live = PICKER_TEMPLATES.find((t) => t.key === liveKey);
    const rest = PICKER_TEMPLATES.filter((t) => t.key !== liveKey);
    const all = live ? [live, ...rest] : PICKER_TEMPLATES;
    return all.filter((t) =>
      filter === 'all' ? true
        : filter === 'new' ? t.isNew
        : filter === 'dark' ? t.surface === 'DARK'
        : t.surface === 'LIGHT',
    );
  }, [liveKey, filter]);

  const apply = useMutation({
    mutationFn: async (templateKey: string) => {
      setApplying(templateKey);
      const result = await propertiesApi.updateBranding(slug, { templateKey });
      // Flush the public page's cache so the switch shows immediately. Not
      // fatal: the template is already saved, and the page refreshes itself.
      try {
        await revalidateMiniSite(slug);
      } catch {
        // Ignored — see above.
      }
      return result;
    },
    onSuccess: (_r, templateKey) => {
      queryClient.invalidateQueries({ queryKey: ['property', slug] });
      setError('');
      const label = PICKER_TEMPLATES.find((t) => t.key === templateKey)?.label ?? 'Template';
      setToast(`${label} is now live on your mini-site`);
      setTimeout(() => setToast(''), 4000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not apply the template'),
    onSettled: () => setApplying(null),
  });

  if (isLoading) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">Loading…</p>;
  }
  if (!property || !saved) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">Development not found.</p>;
  }

  const counts = {
    all: PICKER_TEMPLATES.length,
    new: PICKER_TEMPLATES.filter((t) => t.isNew).length,
    light: PICKER_TEMPLATES.filter((t) => t.surface === 'LIGHT').length,
    dark: PICKER_TEMPLATES.filter((t) => t.surface === 'DARK').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`${base}/${slug}`}
            className="inline-flex items-center gap-1 text-[13px] text-[#5f6368] transition-colors hover:text-[#202124]"
          >
            <MaterialIcon name="arrow_back" className="text-[16px]" />
            Back to development
          </Link>
          <h1 className="mt-2 text-[26px] font-normal text-[#202124]">Mini-site templates</h1>
          <p className="max-w-[70ch] text-[14px] text-[#5f6368]">
            Every template below is your real page, with your photos, units and sections, scrolling
            through on its own. Apply one as it is, or open it to explore and customise first.
          </p>
        </div>
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4]"
        >
          Open live page
          <MaterialIcon name="open_in_new" className="text-[16px]" />
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'new', 'light', 'dark'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            aria-pressed={filter === k}
            className={cn(
              'cursor-pointer rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors',
              filter === k
                ? 'border-[#202124] bg-[#202124] text-white'
                : 'border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]',
            )}
          >
            {k === 'all' ? 'All' : k === 'new' ? 'New' : k === 'light' ? 'Light' : 'Dark'}
            <span className="ml-1.5 tabular-nums opacity-60">{counts[k]}</span>
          </button>
        ))}
      </div>

      {toast && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>}
      {error && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}

      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {ordered.map((t) => (
          <TemplateTile
            key={t.key}
            template={t}
            live={t.key === liveKey}
            src={previewSrcFor(slug, { ...saved, templateKey: t.key })}
            customiseHref={`${base}/${slug}/customise/${t.key.toLowerCase()}`}
            onApply={() => {
              setError('');
              apply.mutate(t.key);
            }}
            applying={applying === t.key}
            busy={apply.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateTile({
  template, live, src, customiseHref, onApply, applying, busy,
}: {
  template: MiniSiteTemplate;
  live: boolean;
  src: string;
  customiseHref: string;
  onApply: () => void;
  applying: boolean;
  busy: boolean;
}) {
  const mat = MATS[template.key] ?? '#d9dde3';
  const tags = [template.isNew && 'New', template.surface === 'DARK' ? 'Dark' : 'Light'].filter(Boolean).join(' · ');

  return (
    <article>
      <div
        className={cn(
          'group relative aspect-[4/3] overflow-hidden rounded-[22px]',
          live && 'outline outline-2 outline-offset-4 outline-[#1a73e8]',
        )}
        style={{ background: mat }}
      >
        {/* The page, inset on its backdrop: margin at the top and sides,
            running off the bottom edge like a browser window. */}
        <div className="absolute inset-x-[7%] bottom-0 top-[8%] overflow-hidden rounded-t-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
          <LiveFrame src={src} title={`${template.label} template preview`} />
        </div>

        {live && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#111]/80 px-2.5 py-1 text-[11.5px] font-medium text-[#81c995] shadow-sm">
            <MaterialIcon name="check_circle" size={13} fill /> Live
          </span>
        )}

        {/* Covers the frame: wheel and touch scroll the dashboard, not the
            preview, and a click opens this template's customise page. */}
        <Link href={customiseHref} aria-label={`Customise ${template.label}`} className="absolute inset-0 z-[5] flex items-end justify-center pb-5">
          <span className="translate-y-2 rounded-full bg-[#111]/85 px-4 py-2 text-[13px] font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            Customise &amp; explore
          </span>
        </Link>
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-medium text-[#202124]">{template.label}</h2>
          <p className="truncate text-[14px] text-[#80868b]" title={template.note}>{tags}</p>
        </div>
        {live ? (
          <span className="shrink-0 rounded-[10px] bg-[#e6f4ea] px-3.5 py-2 text-[14px] font-medium text-[#188038]">Applied</span>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={busy}
            className="shrink-0 cursor-pointer rounded-[10px] bg-[#f1f3f4] px-3.5 py-2 text-[14px] font-medium text-[#202124] transition-colors hover:bg-[#1a73e8] hover:text-white disabled:opacity-50"
          >
            {applying ? 'Applying…' : 'Apply'}
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * The real page in an iframe, rendered at desktop width and scaled to fill its
 * box, scrolling through on its own. Not interactive. Mounted only as it nears
 * the viewport, and it only scrolls while on screen, so twenty pages never
 * load or animate at once.
 */
function LiveFrame({ src, title }: { src: string; title: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mounted, setMounted] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    const mountIo = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          mountIo.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    mountIo.observe(el);
    const visIo = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.15 });
    visIo.observe(el);
    return () => {
      ro.disconnect();
      mountIo.disconnect();
      visIo.disconnect();
    };
  }, []);

  // Auto-scroll: down to the bottom, pause, back to the top faster, pause, repeat.
  useEffect(() => {
    if (!loaded || !onScreen) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let doc: Document | null = null;
    try {
      doc = frameRef.current?.contentWindow?.document ?? null;
    } catch {
      return; // cross-origin: leave it still
    }
    if (!doc) return;
    const d = doc;
    const root = () => d.scrollingElement ?? d.documentElement;

    let raf = 0;
    let last = 0;
    let pauseUntil = performance.now() + SCROLL_PAUSE;
    let dir: 1 | -1 = 1;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (now < pauseUntil) return;
      const el = root();
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      const step = ((SCROLL_SPEED * dt) / 1000) * (dir === 1 ? 1 : 3);
      const next = Math.max(0, Math.min(max, el.scrollTop + step * dir));
      el.scrollTop = next;
      if ((dir === 1 && next >= max - 1) || (dir === -1 && next <= 0)) {
        dir = dir === 1 ? -1 : 1;
        pauseUntil = now + SCROLL_PAUSE;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loaded, onScreen]);

  const scale = size.w ? size.w / FRAME_WIDTH : 0;
  const frameH = scale ? size.h / scale : 0;

  return (
    <div ref={boxRef} className="relative h-full w-full" style={{ background: '#ffffff' }}>
      {mounted && scale > 0 && (
        <iframe
          ref={frameRef}
          title={title}
          src={src}
          tabIndex={-1}
          aria-hidden="true"
          scrolling="no"
          onLoad={() => setLoaded(true)}
          className="pointer-events-none absolute left-0 top-0 origin-top-left select-none border-0"
          style={{ width: FRAME_WIDTH, height: frameH, transform: `scale(${scale})` }}
        />
      )}
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <MaterialIcon name="progress_activity" size={20} className="animate-spin text-[#9aa0a6]" />
        </div>
      )}
    </div>
  );
}
