'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../../../components/dashboard/MaterialIcon';
import { propertiesApi } from '../../../../../../lib/api/properties';
import { ApiError } from '../../../../../../lib/api/client';
import {
  BRAND_FONTS,
  DEFAULT_BRAND_COLOR,
  DEFAULT_CTA_LABEL,
  DEFAULT_HERO_STYLE,
  DEFAULT_NAVBAR_STYLE,
  DEFAULT_NAVBAR_THEME,
  HERO_STYLES,
  NAVBAR_STYLES,
  NAVBAR_THEMES,
  SECTIONS,
  THEME_PRESETS,
  buildTheme,
  navbarPalette,
  contrastRatio,
  parseHex,
} from '../../../../../../lib/branding/theme';
import { cn } from '../../../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';

interface Draft {
  brandColor: string;
  brandFont: string;
  heroStyle: string;
  ctaLabel: string;
  navbarStyle: string;
  navbarTheme: string;
  heroOverlay: boolean;
  sectionOrder: string[];
  hiddenSections: string[];
}

export default function CustomiseMiniSite() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => propertiesApi.get(slug),
  });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  /** Bumped to remount the preview iframe — see the save handler. */
  const [previewNonce, setPreviewNonce] = useState(0);
  /**
   * Set when the browser refuses to frame the preview. A blocked frame just
   * renders blank, which reads as a broken editor — so say what happened and
   * offer the same preview in a new tab instead.
   */
  const [previewBlocked, setPreviewBlocked] = useState(false);

  // Seed the draft once the development loads. Falling back to the developer's
  // own defaults means an unbranded development still opens on their colours
  // rather than on ours.
  useEffect(() => {
    if (!property || draft) return;
    const p = property as unknown as Record<string, unknown>;
    const dev = (p.developer ?? {}) as Record<string, unknown>;
    setDraft({
      brandColor: (p.brandColor as string) || (dev.brandColor as string) || DEFAULT_BRAND_COLOR,
      brandFont: (p.brandFont as string) || (dev.brandFont as string) || 'MODERN',
      heroStyle: (p.heroStyle as string) || DEFAULT_HERO_STYLE,
      ctaLabel: (p.ctaLabel as string) || DEFAULT_CTA_LABEL,
      sectionOrder: (p.sectionOrder as string[])?.length
        ? (p.sectionOrder as string[])
        : SECTIONS.map((s) => s.id),
      navbarStyle: (p.navbarStyle as string) || DEFAULT_NAVBAR_STYLE,
      navbarTheme: (p.navbarTheme as string) || DEFAULT_NAVBAR_THEME,
      heroOverlay: p.heroOverlay !== false,
      hiddenSections: (p.hiddenSections as string[]) ?? [],
    });
  }, [property, draft]);

  const theme = useMemo(
    () => buildTheme(draft?.brandColor, draft?.brandFont),
    [draft?.brandColor, draft?.brandFont],
  );

  const save = useMutation({
    mutationFn: () => propertiesApi.updateBranding(slug, draft!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', slug] });
      setError('');
      setToast('Saved — your mini-site is updated');
      setTimeout(() => setToast(''), 4000);
      // Remount the iframe rather than calling contentWindow.location
      // .reload(): touching the frame's location throws SecurityError the
      // moment the browser treats it as cross-origin, which is what happens
      // whenever framing is blocked. Changing the key reloads it without ever
      // reaching inside.
      setPreviewNonce((n) => n + 1);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not save'),
  });

  if (isLoading || !draft) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">Loading…</p>;
  }
  if (!property) {
    return <p className="py-16 text-center text-[14px] text-[#5f6368]">Development not found.</p>;
  }

  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });

  const toggleSection = (id: string) => {
    const hidden = draft.hiddenSections.includes(id)
      ? draft.hiddenSections.filter((x) => x !== id)
      : [...draft.hiddenSections, id];
    set({ hiddenSections: hidden });
  };

  const move = (id: string, dir: -1 | 1) => {
    const order = [...draft.sectionOrder];
    const i = order.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    set({ sectionOrder: order });
  };

  // One definition shared by the iframe and the blocked-frame fallback, so a
  // developer who has to open the preview in a tab sees the same unsaved edits.
  const previewSrc =
    `/${slug}/preview?brandColor=${encodeURIComponent(draft.brandColor)}`
    + `&brandFont=${draft.brandFont}`
    + `&heroStyle=${draft.heroStyle}`
    + `&ctaLabel=${encodeURIComponent(draft.ctaLabel)}`
    + `&hidden=${encodeURIComponent(draft.hiddenSections.join(','))}`
    + `&order=${encodeURIComponent(draft.sectionOrder.join(','))}`
    + `&navbarStyle=${draft.navbarStyle}`
    + `&navbarTheme=${draft.navbarTheme}`
    + `&heroOverlay=${draft.heroOverlay ? '1' : '0'}`
    + `&v=${previewNonce}`;

  // A developer can still type a pale colour; we warn rather than block, and
  // the rendered theme darkens link text automatically so it stays readable.
  const colourValid = !!parseHex(draft.brandColor);
  const lowContrast = colourValid && contrastRatio(draft.brandColor, '#ffffff') < 2;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/properties/${slug}`}
            className="inline-flex items-center gap-1 text-[13px] text-[#5f6368] transition-colors hover:text-[#202124]"
          >
            <MaterialIcon name="arrow_back" className="text-[16px]" />
            Back to development
          </Link>
          <h1 className="mt-2 text-[26px] font-normal text-[#202124]">Customise your mini-site</h1>
          <p className="text-[14px] text-[#5f6368]">
            This is the page you share with your buyers. Everything here changes how it looks to
            them — the preview on the right is the real page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4]"
          >
            Open live page
          </a>
          <button
            type="button"
            onClick={() => { setError(''); save.mutate(); }}
            disabled={save.isPending || !colourValid}
            className="rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40"
          >
            {save.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {toast && <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{toast}</p>}
      {error && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ── Controls ── */}
        <div className="space-y-5 lg:col-span-2">
          {/* Presets first: most developers click one and stop, which is the
              point — the default must never be embarrassing. */}
          <section className={cardCls}>
            <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Start from a look</h2>
            <p className="mb-4 text-[13px] text-[#5f6368]">
              Pick one, then fine-tune below if you want to.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {THEME_PRESETS.map((p) => {
                const active = draft.brandColor.toLowerCase() === p.color && draft.brandFont === p.font;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => set({ brandColor: p.color, brandFont: p.font })}
                    className={cn(
                      'flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-colors cursor-pointer',
                      active ? 'border-[#1a73e8] bg-[#e8f0fe]' : 'border-[#dadce0] hover:bg-[#f8f9fa]',
                    )}
                  >
                    <span
                      className="h-8 w-8 shrink-0 rounded-lg"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-[14px] font-medium text-[#202124]">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Colour */}
          <section className={cardCls}>
            <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Brand colour</h2>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colourValid ? draft.brandColor : DEFAULT_BRAND_COLOR}
                onChange={(e) => set({ brandColor: e.target.value })}
                aria-label="Brand colour"
                className="h-11 w-14 cursor-pointer rounded-xl border border-[#dadce0] bg-white p-1"
              />
              <input
                value={draft.brandColor}
                onChange={(e) => set({ brandColor: e.target.value })}
                spellCheck={false}
                className={cn(
                  'h-11 flex-1 rounded-xl border px-3 font-mono text-[14px] outline-none',
                  colourValid ? 'border-[#dadce0] focus:border-[#1a73e8]' : 'border-[#c5221f]',
                )}
              />
            </div>
            {!colourValid && (
              <p className="mt-2 text-[12px] text-[#c5221f]">Enter a hex colour like #1a73e8.</p>
            )}
            {lowContrast && (
              <p className="mt-2 text-[12px] text-[#b06000]">
                This colour is very light. Buttons will still be readable — we darken text
                automatically — but a deeper shade usually looks better.
              </p>
            )}

            {/* Derived palette, so the single input visibly produces a set. */}
            <div className="mt-4 flex gap-2">
              {[
                { label: 'Buttons', c: theme.color },
                { label: 'Hover', c: theme.hover },
                { label: 'Text', c: theme.text },
                { label: 'Tint', c: theme.subtle },
              ].map((s) => (
                <div key={s.label} className="flex-1">
                  <div
                    className="h-9 rounded-lg border border-black/5"
                    style={{ backgroundColor: s.c }}
                  />
                  <p className="mt-1 text-center text-[11px] text-[#5f6368]">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Typeface */}
          <section className={cardCls}>
            <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Typeface</h2>
            <p className="mb-4 text-[13px] text-[#5f6368]">
              A short curated set — each pairing is tested against real tours.
            </p>
            <div className="space-y-2">
              {BRAND_FONTS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => set({ brandFont: f.key })}
                  className={cn(
                    'w-full rounded-2xl border p-3 text-left transition-colors cursor-pointer',
                    draft.brandFont === f.key
                      ? 'border-[#1a73e8] bg-[#e8f0fe]'
                      : 'border-[#dadce0] hover:bg-[#f8f9fa]',
                  )}
                >
                  <p className="text-[15px] text-[#202124]" style={{ fontFamily: f.heading }}>
                    {f.label}
                  </p>
                  <p className="text-[12px] text-[#5f6368]">{f.note}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Navbar */}
          <section className={cardCls}>
            <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Navigation bar</h2>
            <p className="mb-4 text-[13px] text-[#5f6368]">
              How the bar at the top of your page looks.
            </p>

            <div className="space-y-2">
              {NAVBAR_STYLES.map((n) => (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => set({ navbarStyle: n.key })}
                  className={cn(
                    'w-full rounded-2xl border p-3 text-left transition-colors cursor-pointer',
                    draft.navbarStyle === n.key
                      ? 'border-[#1a73e8] bg-[#e8f0fe]'
                      : 'border-[#dadce0] hover:bg-[#f8f9fa]',
                  )}
                >
                  <p className="text-[14px] font-medium text-[#202124]">{n.label}</p>
                  <p className="text-[12px] text-[#5f6368]">{n.note}</p>
                </button>
              ))}
            </div>

            <p className="mt-4 mb-2 text-[12px] uppercase tracking-wide text-[#5f6368]">
              Bar colour
            </p>
            <div className="grid grid-cols-3 gap-2">
              {NAVBAR_THEMES.map((t) => {
                // Show the actual resulting bar, not a label — a swatch is a
                // faster read than the word "Dark".
                const pal = navbarPalette(t.key, draft.brandColor);
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => set({ navbarTheme: t.key })}
                    title={t.note}
                    className={cn(
                      'rounded-2xl border p-2 text-left transition-colors cursor-pointer',
                      draft.navbarTheme === t.key
                        ? 'border-[#1a73e8] bg-[#e8f0fe]'
                        : 'border-[#dadce0] hover:bg-[#f8f9fa]',
                    )}
                  >
                    <span
                      className="mb-1.5 flex h-7 items-center justify-center rounded-lg text-[10px] font-semibold"
                      style={{
                        backgroundColor: pal.background,
                        color: pal.foreground,
                        border: `1px solid ${pal.border}`,
                      }}
                    >
                      Aa
                    </span>
                    <span className="block text-[12px] font-medium text-[#202124]">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Hero + CTA */}
          <section className={cardCls}>
            <h2 className="mb-4 text-[16px] font-medium text-[#202124]">Opening &amp; call to action</h2>
            <div className="space-y-2">
              {HERO_STYLES.map((h) => (
                <button
                  key={h.key}
                  type="button"
                  onClick={() => set({ heroStyle: h.key })}
                  className={cn(
                    'w-full rounded-2xl border p-3 text-left transition-colors cursor-pointer',
                    draft.heroStyle === h.key
                      ? 'border-[#1a73e8] bg-[#e8f0fe]'
                      : 'border-[#dadce0] hover:bg-[#f8f9fa]',
                  )}
                >
                  <p className="text-[14px] font-medium text-[#202124]">{h.label}</p>
                  <p className="text-[12px] text-[#5f6368]">{h.note}</p>
                </button>
              ))}
            </div>

            {/* The overlay is what keeps the status chips legible over a
                photograph, so turning it off is offered next to the hero
                choice rather than buried — a developer should see the two
                decisions together. */}
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dadce0] p-3">
              <input
                type="checkbox"
                checked={draft.heroOverlay}
                onChange={(e) => set({ heroOverlay: e.target.checked })}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-[#1a73e8]"
              />
              <span>
                <span className="block text-[14px] font-medium text-[#202124]">
                  Fade the hero image into the page
                </span>
                <span className="block text-[12px] text-[#5f6368]">
                  Softens the top and bottom of the image. Turn it off to show the
                  render exactly as shot — the status chips then sit directly on the
                  photograph.
                </span>
              </span>
            </label>

            <label className="mt-4 block text-[12px] uppercase tracking-wide text-[#5f6368]">
              Button wording
            </label>
            <input
              value={draft.ctaLabel}
              onChange={(e) => set({ ctaLabel: e.target.value })}
              maxLength={40}
              placeholder={DEFAULT_CTA_LABEL}
              className="mt-1 h-11 w-full rounded-xl border border-[#dadce0] px-3 text-[14px] outline-none focus:border-[#1a73e8]"
            />
            <p className="mt-1 text-[12px] text-[#5f6368]">
              e.g. “Request price list”, “Join the pre-launch”.
            </p>
          </section>

          {/* Sections */}
          <section className={cardCls}>
            <h2 className="mb-1 text-[16px] font-medium text-[#202124]">Sections</h2>
            <p className="mb-4 text-[13px] text-[#5f6368]">
              Reorder or hide. Some developments lead with units, others with location.
            </p>
            <ul className="space-y-1.5">
              {draft.sectionOrder.map((id, i) => {
                const meta = SECTIONS.find((s) => s.id === id);
                if (!meta) return null;
                const locked = 'alwaysOn' in meta && meta.alwaysOn;
                const hidden = draft.hiddenSections.includes(id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-xl border border-[#dadce0] px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => move(id, -1)}
                        disabled={i === 0}
                        aria-label={`Move ${meta.label} up`}
                        className="text-[#5f6368] disabled:opacity-25 cursor-pointer"
                      >
                        <MaterialIcon name="keyboard_arrow_up" className="text-[16px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(id, 1)}
                        disabled={i === draft.sectionOrder.length - 1}
                        aria-label={`Move ${meta.label} down`}
                        className="text-[#5f6368] disabled:opacity-25 cursor-pointer"
                      >
                        <MaterialIcon name="keyboard_arrow_down" className="text-[16px]" />
                      </button>
                    </div>
                    <span
                      className={cn(
                        'flex-1 text-[14px]',
                        hidden ? 'text-[#80868b] line-through' : 'text-[#202124]',
                      )}
                    >
                      {meta.label}
                    </span>
                    {locked ? (
                      <span className="text-[11px] text-[#5f6368]">always shown</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleSection(id)}
                        className="text-[#5f6368] hover:text-[#202124] cursor-pointer"
                        aria-label={hidden ? `Show ${meta.label}` : `Hide ${meta.label}`}
                      >
                        <MaterialIcon
                          name={hidden ? 'visibility_off' : 'visibility'}
                          className="text-[18px]"
                        />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* ── Live preview ──
            The real page in an iframe, not a mock: what they approve here is
            exactly what their buyers will open. */}
        <div className="lg:col-span-3">
          <div className="sticky top-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-medium text-[#5f6368]">Live preview</p>
              <button
                type="button"
                onClick={() => setPreviewNonce((n) => n + 1)}
                className="flex items-center gap-1 text-[13px] text-[#1a73e8] hover:underline cursor-pointer"
              >
                <MaterialIcon name="refresh" className="text-[15px]" />
                Refresh
              </button>
            </div>

            {/* A dedicated /preview route, not the public page with a query
                param: reading searchParams on /[slug] opted it out of static
                generation, making every buyer's page slower to serve this
                editor. The preview renders the same components. */}
            {previewBlocked ? (
              <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center">
                <MaterialIcon name="visibility_off" size={26} className="text-[#80868b]" />
                <p className="mt-2 text-[15px] text-[#5f6368]">
                  The preview can&apos;t be shown inline here.
                </p>
                <a
                  href={previewSrc}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 inline-block rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]"
                >
                  Open preview in a new tab
                </a>
              </div>
            ) : (
            <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
              <iframe
                key={previewNonce}
                title="Mini-site preview"
                src={previewSrc}
                className="h-[76vh] w-full"
                onError={() => setPreviewBlocked(true)}
              />
            </div>
            )}
            <p className="mt-2 text-[12px] text-[#5f6368]">
              Unsaved changes appear here immediately. Buyers see them once you save.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
