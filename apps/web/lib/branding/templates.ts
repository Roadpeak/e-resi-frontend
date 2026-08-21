/**
 * Mini-site templates.
 *
 * A template is the *shell* a development's page is poured into — navbar,
 * hero, section chrome and footer — not a rewrite of the sections themselves.
 * Every template renders the same PropertySection components with the same
 * data and the same behaviour; what changes is the surface around them.
 *
 * That boundary is deliberate. The sections carry real logic — unit
 * availability, reservations, viewing bookings, tour launches, analytics — and
 * duplicating that per template would mean building every future feature eight
 * times and letting eight copies drift apart. Templates own presentation only.
 */

export type TemplateSurface = 'LIGHT' | 'DARK';

export interface MiniSiteTemplate {
  key: string;
  label: string;
  /** One line, shown in the picker so the choice is not blind. */
  note: string;
  /** Ground the page sits on; section chrome derives its contrast from this. */
  surface: TemplateSurface;
  /** Editorial description of the hero treatment, for the picker's preview. */
  heroNote: string;
  /**
   * Whether this template's own hero replaces the configurable heroStyle.
   * Templates with a signature opening (an oversized wordmark, an inset card)
   * own it; the plainer ones defer to the developer's heroStyle choice.
   */
  ownsHero: boolean;
  /** Alternate section grounds, giving a long page rhythm. */
  banded: boolean;
  /** Print a small caps label above each section. */
  sectionHeadings: boolean;
  /** Generous vertical spacing between sections. */
  airy: boolean;
  /**
   * The template's own typography.
   *
   * A template is a designed thing, and its type is part of that design — the
   * reference layouts are not interchangeable with each other's faces. This
   * takes precedence over the developer's brand font, which continues to apply
   * on CLASSIC where no template opinion exists.
   */
  fonts: {
    /** Display face for headings. */
    heading: string;
    /** Text face for body copy. */
    body: string;
    /** Heading weight — light display type is central to several of these. */
    headingWeight: number;
    /** Tracking for large headings, in em. */
    headingTracking: string;
    /** Uppercase small-caps labels, as the editorial layouts use. */
    upperLabels: boolean;
  };
}

/**
 * The catalogue. Keys are stored on the property row, so they are permanent —
 * renaming one orphans every development already using it.
 */
export const MINI_SITE_TEMPLATES: MiniSiteTemplate[] = [
  {
    key: 'CLASSIC',
    label: 'Classic',
    note: 'The original e-resi layout. Neutral and safe for any development.',
    surface: 'LIGHT',
    heroNote: 'Uses whichever hero style you pick below.',
    ownsHero: false,
    banded: false,
    sectionHeadings: false,
    airy: false,
    fonts: {
      heading: 'var(--font-jakarta), system-ui, sans-serif',
      body: 'var(--font-jakarta), system-ui, sans-serif',
      headingWeight: 600,
      headingTracking: '-0.02em',
      upperLabels: false,
    },
  },
  {
    key: 'EDITORIAL',
    label: 'Editorial',
    note: 'Centred headline over full-bleed photography, then a calm white page.',
    surface: 'LIGHT',
    heroNote: 'Centred title and subtitle over the hero image.',
    ownsHero: true,
    banded: true,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-playfair), Georgia, serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 400,
      headingTracking: '-0.01em',
      upperLabels: true,
    },
  },
  {
    key: 'CONFIDENT',
    label: 'Confident',
    note: 'Big left-aligned headline with a facts bar floating over the hero.',
    surface: 'LIGHT',
    heroNote: 'Left-aligned headline; price, units and completion float below it.',
    ownsHero: true,
    banded: true,
    sectionHeadings: true,
    airy: false,
    fonts: {
      heading: 'var(--font-archivo), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 700,
      headingTracking: '-0.03em',
      upperLabels: false,
    },
  },
  {
    key: 'STATEMENT',
    label: 'Statement',
    note: 'The development name set oversized across the hero. Bold and graphic.',
    surface: 'DARK',
    heroNote: 'Name rendered edge-to-edge over the image, dark page beneath.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-archivo), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 700,
      headingTracking: '-0.04em',
      upperLabels: true,
    },
  },
  {
    key: 'LUXE_DARK',
    label: 'Dark Luxury',
    note: 'Near-black page with glass stat cards. Suits premium villas.',
    surface: 'DARK',
    heroNote: 'Oversized name, floating glass cards carrying the key numbers.',
    ownsHero: true,
    banded: true,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-jakarta), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 300,
      headingTracking: '-0.02em',
      upperLabels: true,
    },
  },
  {
    key: 'SHOWCASE',
    label: 'Showcase',
    note: 'Inset rounded hero with a floating unit card. Polished and product-like.',
    surface: 'LIGHT',
    heroNote: 'Rounded hero panel with a featured unit card floating over it.',
    ownsHero: true,
    banded: true,
    sectionHeadings: true,
    airy: false,
    fonts: {
      heading: 'var(--font-jakarta), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 600,
      headingTracking: '-0.02em',
      upperLabels: false,
    },
  },
  {
    key: 'ARCHITECTURAL',
    label: 'Architectural',
    note: 'Quiet hero with a stat row along its base. Lets the building lead.',
    surface: 'LIGHT',
    heroNote: 'Eyebrow, headline and a row of figures across the hero base.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-inter), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 400,
      headingTracking: '-0.02em',
      upperLabels: true,
    },
  },
  {
    key: 'WARM_LUXE',
    label: 'Warm Luxe',
    note: 'Warm neutral ground, inset hero card, generous spacing.',
    surface: 'LIGHT',
    heroNote: 'Inset rounded hero on a warm ground, with a floating unit card.',
    ownsHero: true,
    banded: true,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-cormorant), Georgia, serif',
      body: 'var(--font-jakarta), system-ui, sans-serif',
      headingWeight: 400,
      headingTracking: '-0.01em',
      upperLabels: true,
    },
  },
];

export const DEFAULT_TEMPLATE = 'CLASSIC';

export function templateFor(key?: string | null): MiniSiteTemplate {
  return MINI_SITE_TEMPLATES.find((t) => t.key === key) ?? MINI_SITE_TEMPLATES[0];
}

/**
 * Surface tokens for a template's ground.
 *
 * Section components render on whatever the template provides, so each needs a
 * matching set of text and border values — otherwise a dark template shows the
 * sections' default near-black text on a near-black page.
 */
export interface SurfaceTokens {
  /** Page background. */
  bg: string;
  /** A raised panel on that background — cards, wells. */
  panel: string;
  /** Primary text. */
  text: string;
  /** Secondary text: labels, captions, meta. */
  muted: string;
  /** Hairline borders and dividers. */
  border: string;
  /** True when the ground is dark, so children can flip their treatments. */
  onDark: boolean;
}

export function surfaceTokens(surface: TemplateSurface): SurfaceTokens {
  if (surface === 'DARK') {
    return {
      bg: '#0b0b0c',
      panel: 'rgba(255,255,255,0.04)',
      text: '#f5f5f6',
      muted: 'rgba(245,245,246,0.62)',
      border: 'rgba(255,255,255,0.12)',
      onDark: true,
    };
  }
  return {
    bg: '#ffffff',
    panel: '#f7f8fa',
    text: '#18191a',
    muted: 'rgba(24,25,26,0.60)',
    border: 'rgba(0,0,0,0.08)',
    onDark: false,
  };
}

/**
 * CSS custom properties for a template's surface.
 *
 * Exposed as variables rather than classes so the existing section components
 * can opt in gradually — anything that reads `--surface-text` follows the
 * template, anything that does not keeps its current appearance.
 */
export function templateFontVars(template: MiniSiteTemplate): Record<string, string> {
  return {
    '--tpl-font-heading': template.fonts.heading,
    '--tpl-font-body': template.fonts.body,
    '--tpl-heading-weight': String(template.fonts.headingWeight),
    '--tpl-heading-tracking': template.fonts.headingTracking,
  };
}

export function surfaceVars(surface: TemplateSurface): Record<string, string> {
  const t = surfaceTokens(surface);
  return {
    '--surface-bg': t.bg,
    '--surface-panel': t.panel,
    '--surface-text': t.text,
    '--surface-muted': t.muted,
    '--surface-border': t.border,
  };
}
