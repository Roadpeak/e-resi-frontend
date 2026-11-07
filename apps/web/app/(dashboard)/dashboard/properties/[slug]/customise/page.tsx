'use client';

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
 * Template gallery.
 *
 * Every template is shown as the real page — this development's own content,
 * colours and sections — rendered live at desktop width, one per section down
 * the page. Apply switches the live mini-site to it; Customise opens that
 * template's own editor, where all the styling tools live.
 */

/** Desktop width each template is rendered at before being scaled to fit. */
const FRAME_WIDTH = 1440;
const FRAME_HEIGHT = 900;

export default function TemplateGallery() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => propertiesApi.get(slug),
  });

  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [applying, setApplying] = useState<string | null>(null);

  const saved: MiniSiteDraft | null = useMemo(() => (property ? draftFromProperty(property) : null), [property]);
  const liveKey = saved?.templateKey ?? DEFAULT_TEMPLATE;

  // The live template first, then the rest in picker order (newest designs first).
  const ordered = useMemo(() => {
    const live = PICKER_TEMPLATES.find((t) => t.key === liveKey);
    return live ? [live, ...PICKER_TEMPLATES.filter((t) => t.key !== liveKey)] : PICKER_TEMPLATES;
  }, [liveKey]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/properties/${slug}`}
            className="inline-flex items-center gap-1 text-[13px] text-[#5f6368] transition-colors hover:text-[#202124]"
          >
            <MaterialIcon name="arrow_back" className="text-[16px]" />
            Back to development
          </Link>
          <h1 className="mt-2 text-[26px] font-normal text-[#202124]">Mini-site templates</h1>
          <p className="max-w-[70ch] text-[14px] text-[#5f6368]">
            Each template below is your real page, with your photos, units and sections. Scroll
            inside any of them to explore it. Apply one as it is, or open Customise to change its
            colours, type, navigation and sections first.
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

      {toast && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>}
      {error && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}

      <div className="space-y-10">
        {ordered.map((t, i) => (
          <TemplateShowcase
            key={t.key}
            index={i}
            total={ordered.length}
            template={t}
            live={t.key === liveKey}
            src={previewSrcFor(slug, { ...saved, templateKey: t.key })}
            customiseHref={`/dashboard/properties/${slug}/customise/${t.key.toLowerCase()}`}
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

function TemplateShowcase({
  template, index, total, live, src, customiseHref, onApply, applying, busy,
}: {
  template: MiniSiteTemplate;
  index: number;
  total: number;
  live: boolean;
  src: string;
  customiseHref: string;
  onApply: () => void;
  applying: boolean;
  busy: boolean;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[28px] border bg-white',
        live ? 'border-[#1a73e8] ring-1 ring-[#1a73e8]' : 'border-[#dadce0]',
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] tabular-nums text-[#80868b]">
              {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <h2 className="text-[20px] font-medium text-[#202124]">{template.label}</h2>
            {live && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-[12px] font-medium text-[#188038]">
                <MaterialIcon name="check_circle" size={14} fill /> Live on your page
              </span>
            )}
            {template.isNew && (
              <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#1a73e8]">
                New
              </span>
            )}
            {template.surface === 'DARK' && (
              <span className="rounded-full bg-[#202124] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white">
                Dark
              </span>
            )}
          </div>
          <p className="mt-1 max-w-[80ch] text-[13.5px] text-[#5f6368]">{template.note}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={customiseHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4]"
          >
            <MaterialIcon name="tune" size={18} />
            Customise
          </Link>
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-5 py-2 text-[14px] font-medium text-[#188038]">
              <MaterialIcon name="check" size={18} />
              Applied
            </span>
          ) : (
            <button
              type="button"
              onClick={onApply}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50"
            >
              {applying ? 'Applying…' : 'Apply template'}
            </button>
          )}
        </div>
      </header>

      <LiveFrame src={src} title={`${template.label} template preview`} />
    </section>
  );
}

/**
 * The real page in an iframe, rendered at desktop width and scaled down to the
 * card, so a developer sees the layout buyers on a laptop see — not a squeezed
 * mobile view. Mounted only as it nears the viewport: fifteen full pages
 * loading at once would stall the dashboard.
 */
function LiveFrame({ src, title }: { src: string; title: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  // Never upscale past 1:1; on very wide screens the frame simply fills.
  const scale = width ? Math.min(1, width / FRAME_WIDTH) : 0;
  const frameW = scale < 1 ? FRAME_WIDTH : width;
  const height = scale ? FRAME_HEIGHT * scale : 0;

  return (
    <div className="border-t border-[#dadce0] bg-[#f1f3f4]">
      {/* Browser chrome, so the frame reads as a web page rather than an image. */}
      <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f8f9fa] px-4 py-2">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#dadce0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#dadce0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#dadce0]" />
        </span>
        <span className="ml-2 truncate rounded-full bg-white px-3 py-0.5 text-[11.5px] text-[#5f6368]">
          Live preview · scroll to explore
        </span>
        <a
          href={src}
          target="_blank"
          rel="noreferrer noopener"
          className="ml-auto inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-[#1a73e8] hover:underline"
        >
          Full screen <MaterialIcon name="open_in_full" size={14} />
        </a>
      </div>

      <div
        ref={boxRef}
        className="relative w-full overflow-hidden"
        style={{ height: height || 'min(56vw, 720px)' }}
      >
        {visible && scale > 0 && (
          <iframe
            title={title}
            src={src}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className="absolute left-0 top-0 origin-top-left border-0 bg-white"
            style={{
              width: frameW,
              height: FRAME_HEIGHT,
              transform: scale < 1 ? `scale(${scale})` : undefined,
            }}
          />
        )}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-center gap-2 text-[13px] text-[#5f6368]">
              <MaterialIcon name="progress_activity" size={18} className="animate-spin" />
              Loading template…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
