'use client';

import { cn } from '../../lib/utils';
import type { MiniSiteTemplate } from '../../lib/branding/templates';

/**
 * A drawn preview of what a template actually looks like.
 *
 * The picker used to stand each template in for itself with a 36px two-tone
 * chip — light on top, dark below — which told a developer only whether the
 * page was dark. Eight of those in a column is a list of near-identical
 * squares next to eight lines of prose, so the choice was effectively blind
 * and the copy was doing all the work.
 *
 * These are hand-drawn skeletons rather than screenshots or live iframes.
 * Screenshots go stale the moment a template changes — and every template has
 * just changed. Eight live iframes would mean eight simultaneous renders of a
 * heavy page inside a dashboard panel. A skeleton encodes *structure*, which
 * is the thing that actually differs between these layouts: where the headline
 * sits, whether the hero is inset or full-bleed, whether figures float over the
 * image or sit beneath it, how the sections below are ruled or banded.
 *
 * They also take the developer's own brand colour, so the card previews the
 * page they will actually get rather than a generic one.
 */

/** Ground and ink for a template's surface, matching surfaceTokens(). */
function palette(t: MiniSiteTemplate, key: string) {
  const dark = t.surface === 'DARK';
  const grounds: Record<string, string> = {
    SHOWCASE: '#f4f5f7',
    WARM_LUXE: '#f3efe9',
    STATEMENT: '#0b0b0c',
    LUXE_DARK: '#0b0b0c',
  };
  return {
    dark,
    ground: grounds[key] ?? (dark ? '#0b0b0c' : '#ffffff'),
    ink: dark ? 'rgba(255,255,255,0.92)' : 'rgba(24,25,26,0.88)',
    muted: dark ? 'rgba(255,255,255,0.34)' : 'rgba(24,25,26,0.26)',
    rule: dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)',
    /** The photograph, suggested rather than shown. */
    photo: dark ? 'rgba(255,255,255,0.13)' : 'rgba(24,25,26,0.18)',
  };
}

/** A run of text, as a bar. Width is a percentage of its container. */
function Line({
  w,
  h = 3,
  color,
  className,
}: {
  w: string;
  h?: number;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn('block rounded-[1px]', className)}
      style={{ width: w, height: h, background: color }}
    />
  );
}

export function TemplatePreviewCard({
  template,
  brandColor,
  className,
}: {
  template: MiniSiteTemplate;
  /** The developer's chosen colour, so the preview is of their page. */
  brandColor: string;
  className?: string;
}) {
  const p = palette(template, template.key);
  const k = template.key;

  /** The hero, per template. This is where they genuinely differ. */
  const hero = (() => {
    // Inset, rounded, on a tinted ground — Showcase and Warm Luxe.
    if (k === 'SHOWCASE' || k === 'WARM_LUXE') {
      return (
        <div className="p-1.5">
          <div
            className="relative flex h-[46px] flex-col justify-center gap-1 rounded-[4px] px-2.5"
            style={{ background: p.photo }}
          >
            <Line w="52%" h={5} color={p.ink} />
            <Line w="34%" color={p.muted} />
            <span
              className="mt-0.5 block h-[7px] w-[22px] rounded-[2px]"
              style={{ background: brandColor }}
            />
            {/* Showcase floats a unit card over the image; Warm Luxe puts its
                figures on the ground below, so it is drawn outside. */}
            {k === 'SHOWCASE' && (
              <span
                className="absolute bottom-1.5 right-1.5 block h-[14px] w-[26px] rounded-[3px]"
                style={{ background: 'rgba(255,255,255,0.92)' }}
              />
            )}
          </div>
          {k === 'WARM_LUXE' && (
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block h-[13px] rounded-[3px]"
                  style={{ background: 'rgba(255,255,255,0.7)' }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Centred name over the image — Editorial, Statement, Dark Luxury.
    const centred = k === 'EDITORIAL' || k === 'STATEMENT' || k === 'LUXE_DARK';
    if (centred) {
      // Statement and Luxe set the name oversized; Editorial keeps it modest
      // under a location eyebrow.
      const big = k !== 'EDITORIAL';
      return (
        <div
          className="relative flex h-[56px] flex-col items-center justify-center gap-1.5"
          style={{ background: p.photo }}
        >
          {k === 'EDITORIAL' && <Line w="18%" h={2} color={p.muted} />}
          <Line w={big ? '76%' : '46%'} h={big ? 8 : 6} color={p.ink} />
          {k === 'EDITORIAL' && <Line w="30%" color={p.muted} />}
          <div className="mt-0.5 flex items-center gap-1">
            <span
              className="block h-[7px] w-[20px] rounded-full"
              style={{ background: brandColor }}
            />
            <span
              className="block h-[7px] w-[16px] rounded-full border"
              style={{ borderColor: p.muted }}
            />
          </div>
          {/* Luxe floats glass figure cards on the right. */}
          {k === 'LUXE_DARK' && (
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 flex-col gap-1">
              {[0, 1].map((i) => (
                <span
                  key={i}
                  className="block h-[11px] w-[20px] rounded-[2px]"
                  style={{ background: 'rgba(255,255,255,0.16)' }}
                />
              ))}
            </div>
          )}
          {/* Statement states its figures under the name. */}
          {k === 'STATEMENT' && (
            <div className="mt-1 flex gap-2.5">
              {[0, 1].map((i) => (
                <Line key={i} w="18px" h={2} color={p.muted} />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Left-aligned over a full-bleed image — Classic, Confident, Architectural.
    return (
      <div
        className="relative flex h-[56px] flex-col justify-end gap-1 px-2.5 pb-2.5"
        style={{ background: p.photo }}
      >
        {k === 'ARCHITECTURAL' && <Line w="16%" h={2} color={p.muted} />}
        <Line w="58%" h={6} color={p.ink} />
        <Line w="38%" color={p.muted} />
        <div className="mt-0.5 flex items-center gap-1">
          <span
            className="block h-[7px] w-[20px] rounded-full"
            style={{ background: brandColor }}
          />
          <span
            className="block h-[7px] w-[16px] rounded-full border"
            style={{ borderColor: p.muted }}
          />
        </div>
        {/* Architectural rules its figures across the base; Confident floats a
            card bar over the seam; Classic carries them inline. */}
        {k === 'ARCHITECTURAL' && (
          <div
            className="mt-1 flex gap-3 border-t pt-1"
            style={{ borderColor: p.rule }}
          >
            {[0, 1, 2].map((i) => (
              <Line key={i} w="14px" h={2} color={p.muted} />
            ))}
          </div>
        )}
        {k === 'CONFIDENT' && (
          <div className="absolute -bottom-[7px] left-2.5 right-2.5 flex gap-[1px] overflow-hidden rounded-[3px]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="block h-[14px] flex-1 bg-white" />
            ))}
          </div>
        )}
        {k === 'CLASSIC' && (
          <div className="mt-1 flex gap-2.5">
            {[0, 1].map((i) => (
              <Line key={i} w="16px" h={2} color={p.muted} />
            ))}
          </div>
        )}
      </div>
    );
  })();

  /** The sections below, suggested by the template's own rhythm. */
  const body = (
    <div className={cn('flex flex-col gap-1.5 px-2.5', k === 'CONFIDENT' ? 'pt-3.5' : 'pt-2.5')}>
      {[0, 1].map((row) => (
        <div
          key={row}
          className="flex flex-col gap-1 py-1"
          style={
            // Banded templates alternate their ground; numbered ones rule
            // above each section instead.
            template.banded && row === 1
              ? {
                  background: p.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
                  margin: '0 -10px',
                  padding: '4px 10px',
                }
              : template.sectionHeadings
                ? { borderTop: `1px solid ${p.rule}`, paddingTop: 4 }
                : undefined
          }
        >
          {template.sectionHeadings && (
            <Line w="22%" h={2} color={brandColor} className="opacity-80" />
          )}
          <Line w={row === 0 ? '68%' : '54%'} h={4} color={p.ink} />
          <Line w="88%" color={p.muted} />
          <Line w="76%" color={p.muted} />
        </div>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden
      className={cn('overflow-hidden rounded-[6px]', className)}
      style={{
        background: p.ground,
        // The page's own edge, so a white template still reads as a page
        // rather than dissolving into the card behind it.
        boxShadow: `inset 0 0 0 1px ${p.rule}`,
        // The template's face, so a serif layout previews as one.
        fontFamily: template.fonts.heading,
      }}
    >
      {/* The bar. Every template has one and they differ only in weight, so it
          is drawn the same everywhere — what varies below is the point. */}
      <div
        className="flex h-[13px] items-center justify-between px-2"
        style={{ borderBottom: `1px solid ${p.rule}` }}
      >
        <Line w="26px" h={3} color={p.ink} />
        <div className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <Line key={i} w="9px" h={2} color={p.muted} />
          ))}
        </div>
        <span
          className={cn('block h-[7px] w-[18px]', template.key === 'LUXE_DARK' ? '' : 'rounded-full')}
          style={{ background: brandColor }}
        />
      </div>

      {hero}
      {body}
      <div className="h-2" />
    </div>
  );
}
