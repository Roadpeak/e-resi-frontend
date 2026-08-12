/**
 * Mini-site branding.
 *
 * The public development page is the developer's own sales site — shared
 * straight to their buyers on WhatsApp — so it wears their brand, not ours.
 *
 * Everything here is deliberately constrained. A developer picks a colour and
 * a curated font pairing; the tints, borders and contrasting foregrounds are
 * derived. That is the whole point: a developer who spent six figures on a
 * tour must not be able to render it unreadable, and whatever they choose has
 * to still look like a site we are willing to be associated with.
 */

/** Fallback accent when nobody has chosen one — e-resi's own blue. */
export const DEFAULT_BRAND_COLOR = '#1a73e8';

export interface BrandFont {
  key: string;
  label: string;
  /** Display face, used for headings. */
  heading: string;
  /** Text face, used for body copy. */
  body: string;
  /** How it reads, shown in the picker so the choice is not blind. */
  note: string;
}

/**
 * Curated pairings. Free-form font input is intentionally not offered: the
 * downside of one bad choice lands on our platform's perceived quality, not
 * just on that development's page.
 */
export const BRAND_FONTS: BrandFont[] = [
  {
    key: 'MODERN',
    label: 'Modern',
    heading: '"Plus Jakarta Sans", system-ui, sans-serif',
    body: '"Plus Jakarta Sans", system-ui, sans-serif',
    note: 'Clean and neutral. Safe for any development.',
  },
  {
    key: 'LUXURY',
    label: 'Luxury',
    heading: '"Playfair Display", Georgia, serif',
    body: '"Inter", system-ui, sans-serif',
    note: 'Serif headings over clean text. Suits villas and premium builds.',
  },
  {
    key: 'MINIMAL',
    label: 'Minimal',
    heading: '"Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    note: 'Understated and quiet. Lets the photography lead.',
  },
  {
    key: 'BOLD',
    label: 'Bold',
    heading: '"Archivo", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
    note: 'Heavy, confident headings. Good for large mixed-use schemes.',
  },
];

export const DEFAULT_BRAND_FONT = 'MODERN';

export function fontFor(key?: string | null): BrandFont {
  return BRAND_FONTS.find((f) => f.key === key) ?? BRAND_FONTS[0];
}

/** One-click starting points. Most developers pick one of these and stop. */
export const THEME_PRESETS = [
  { key: 'MODERN', label: 'Modern', color: '#1a73e8', font: 'MODERN' },
  { key: 'LUXURY', label: 'Luxury', color: '#8a6d3b', font: 'LUXURY' },
  { key: 'MINIMAL', label: 'Minimal', color: '#202124', font: 'MINIMAL' },
  { key: 'BOLD', label: 'Bold', color: '#c5221f', font: 'BOLD' },
] as const;

export const HERO_STYLES = [
  { key: 'CINEMATIC', label: 'Cinematic', note: 'Full-bleed image or video with overlaid title.' },
  { key: 'SPLIT', label: 'Split', note: 'Image on one side, details on the other.' },
  { key: 'MINIMAL', label: 'Minimal', note: 'Compact header, content starts immediately.' },
] as const;

export const DEFAULT_HERO_STYLE = 'CINEMATIC';

/**
 * Sections in their default order. `id` matches the anchor already used on the
 * page, so reordering and hiding need no changes to the section components.
 */
export const SECTIONS = [
  { id: 'overview', label: 'Overview', alwaysOn: true },
  { id: 'gallery', label: 'Gallery' },
  { id: 'cinematic', label: 'Cinematic tour' },
  { id: 'viewer3d', label: '3D tour' },
  { id: 'floorplans', label: 'Floor plans' },
  { id: 'units', label: 'Available units' },
  { id: 'rentals', label: 'Rentals' },
  { id: 'location', label: 'Location' },
  { id: 'construction', label: 'Construction updates' },
  { id: 'booking', label: 'Book a viewing', alwaysOn: true },
] as const;

export const DEFAULT_CTA_LABEL = 'Book a viewing';

// ─── Colour maths ───────────────────────────────────────────────────────────

function clamp(n: number) {
  return Math.min(255, Math.max(0, Math.round(n)));
}

/** #abc and #aabbcc both parse; anything else returns null rather than throwing. */
export function parseHex(hex?: string | null): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;

export function mix(hex: string, target: string, amount: number): string {
  const a = parseHex(hex);
  const b = parseHex(target);
  if (!a || !b) return hex;
  return toHex(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount,
  );
}

/**
 * Relative luminance, per WCAG. Used to decide whether text on the brand
 * colour should be white or near-black — the check that makes an arbitrary
 * developer-chosen colour safe to put a label on.
 */
export function luminance(hex: string): number {
  const c = parseHex(hex);
  if (!c) return 0;
  const [r, g, b] = [c.r, c.g, c.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** White or near-black, whichever is legible on the given background. */
export function readableOn(hex: string): string {
  return contrastRatio(hex, '#ffffff') >= 4.5 ? '#ffffff' : '#202124';
}

export interface BrandTheme {
  color: string;
  /** Text colour that is legible on `color`. */
  onColor: string;
  /** Darkened variant for hover states. */
  hover: string;
  /** Very light wash for section backgrounds. */
  subtle: string;
  /** Light border tint. */
  border: string;
  /** Colour darkened enough to be legible as text on white. */
  text: string;
  font: BrandFont;
}

/**
 * Derive a full theme from a single colour, so one input yields a coherent
 * palette. `text` is darkened until it passes contrast on white — a developer
 * picking a pale yellow still gets readable links rather than invisible ones.
 */
export function buildTheme(color?: string | null, fontKey?: string | null): BrandTheme {
  const base = parseHex(color) ? (color as string) : DEFAULT_BRAND_COLOR;

  let text = base;
  let guard = 0;
  while (contrastRatio(text, '#ffffff') < 4.5 && guard < 20) {
    text = mix(text, '#000000', 0.12);
    guard += 1;
  }

  return {
    color: base,
    onColor: readableOn(base),
    hover: mix(base, '#000000', 0.14),
    subtle: mix(base, '#ffffff', 0.92),
    border: mix(base, '#ffffff', 0.75),
    text,
    font: fontFor(fontKey),
  };
}

/**
 * Theme as CSS custom properties. Applied to a wrapper element so every
 * descendant can use var(--brand) without prop-drilling, and so a server
 * component can set it with no client JS.
 */
export function themeVars(theme: BrandTheme): React.CSSProperties {
  return {
    '--brand': theme.color,
    '--brand-on': theme.onColor,
    '--brand-hover': theme.hover,
    '--brand-subtle': theme.subtle,
    '--brand-border': theme.border,
    '--brand-text': theme.text,
    '--brand-font-heading': theme.font.heading,
    '--brand-font-body': theme.font.body,
  } as React.CSSProperties;
}

/** Property branding as it arrives from the API, with developer fallbacks. */
export interface BrandingSource {
  brandColor?: string | null;
  brandFont?: string | null;
  heroStyle?: string | null;
  sectionOrder?: string[] | null;
  hiddenSections?: string[] | null;
  ctaLabel?: string | null;
  whiteLabel?: boolean | null;
  developer?: {
    brandColor?: string | null;
    brandFont?: string | null;
  } | null;
}

/**
 * Resolve the effective branding for a development: its own values first, the
 * developer's defaults next, ours last. This is what lets a developer brand
 * ten projects by setting two fields once.
 */
export function resolveBranding(src: BrandingSource) {
  const color = src.brandColor || src.developer?.brandColor || DEFAULT_BRAND_COLOR;
  const fontKey = src.brandFont || src.developer?.brandFont || DEFAULT_BRAND_FONT;
  const theme = buildTheme(color, fontKey);

  const hidden = new Set(src.hiddenSections ?? []);
  const ordered = src.sectionOrder?.length
    ? [...src.sectionOrder, ...SECTIONS.map((s) => s.id).filter((id) => !src.sectionOrder!.includes(id))]
    : SECTIONS.map((s) => s.id);

  return {
    theme,
    heroStyle: src.heroStyle || DEFAULT_HERO_STYLE,
    ctaLabel: src.ctaLabel || DEFAULT_CTA_LABEL,
    whiteLabel: !!src.whiteLabel,
    /** Section ids to render, in order, with hidden ones removed. */
    sections: ordered.filter((id) => {
      const meta = SECTIONS.find((s) => s.id === id);
      if (!meta) return false;
      return 'alwaysOn' in meta && meta.alwaysOn ? true : !hidden.has(id);
    }),
    isHidden: (id: string) => hidden.has(id),
  };
}
