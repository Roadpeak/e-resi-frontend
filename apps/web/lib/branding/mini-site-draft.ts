import {
  DEFAULT_BRAND_COLOR,
  DEFAULT_CTA_LABEL,
  DEFAULT_HERO_STYLE,
  DEFAULT_NAVBAR_STYLE,
  DEFAULT_NAVBAR_THEME,
  SECTIONS,
  type SectionCopy,
} from './theme';
import { DEFAULT_TEMPLATE } from './templates';

/** Everything the mini-site editor can change, as one savable object. */
export interface MiniSiteDraft {
  brandColor: string;
  brandFont: string;
  templateKey: string;
  heroStyle: string;
  ctaLabel: string;
  navbarStyle: string;
  navbarTheme: string;
  heroOverlay: boolean;
  sectionOrder: string[];
  hiddenSections: string[];
  sectionCopy: Record<string, SectionCopy>;
  /** Per-unit-type price presentation, keyed by unit type key. */
  unitPriceDisplay: Record<string, string>;
}

/**
 * The development's saved branding as a draft. Falls back to the developer's
 * own defaults, so an unbranded development opens on their colours, not ours.
 */
export function draftFromProperty(property: unknown): MiniSiteDraft {
  const p = property as Record<string, unknown>;
  const dev = (p.developer ?? {}) as Record<string, unknown>;
  return {
    brandColor: (p.brandColor as string) || (dev.brandColor as string) || DEFAULT_BRAND_COLOR,
    brandFont: (p.brandFont as string) || (dev.brandFont as string) || 'MODERN',
    heroStyle: (p.heroStyle as string) || DEFAULT_HERO_STYLE,
    templateKey: (p.templateKey as string) || DEFAULT_TEMPLATE,
    ctaLabel: (p.ctaLabel as string) || DEFAULT_CTA_LABEL,
    sectionOrder: (p.sectionOrder as string[])?.length
      ? (p.sectionOrder as string[])
      : SECTIONS.map((s) => s.id),
    navbarStyle: (p.navbarStyle as string) || DEFAULT_NAVBAR_STYLE,
    navbarTheme: (p.navbarTheme as string) || DEFAULT_NAVBAR_THEME,
    heroOverlay: p.heroOverlay !== false,
    hiddenSections: (p.hiddenSections as string[]) ?? [],
    sectionCopy: (p.sectionCopy as Record<string, SectionCopy>) ?? {},
    unitPriceDisplay: (p.unitPriceDisplay as Record<string, string>) ?? {},
  };
}

/** URL of the /preview route rendering this draft — unsaved edits ride as params. */
export function previewSrcFor(slug: string, draft: MiniSiteDraft, nonce = 0): string {
  return (
    `/${slug}/preview?brandColor=${encodeURIComponent(draft.brandColor)}`
    + `&brandFont=${draft.brandFont}`
    + `&templateKey=${draft.templateKey}`
    + `&heroStyle=${draft.heroStyle}`
    + `&ctaLabel=${encodeURIComponent(draft.ctaLabel)}`
    + `&hidden=${encodeURIComponent(draft.hiddenSections.join(','))}`
    + `&order=${encodeURIComponent(draft.sectionOrder.join(','))}`
    + `&navbarStyle=${draft.navbarStyle}`
    + `&navbarTheme=${draft.navbarTheme}`
    + `&heroOverlay=${draft.heroOverlay ? '1' : '0'}`
    // Copy rides as JSON: it is nested and free-text.
    + `&copy=${encodeURIComponent(JSON.stringify(draft.sectionCopy))}`
    + `&prices=${encodeURIComponent(JSON.stringify(draft.unitPriceDisplay))}`
    + `&v=${nonce}`
  );
}
