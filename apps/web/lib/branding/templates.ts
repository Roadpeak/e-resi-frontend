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
  /** Newly added — listed first in the picker with a "New" badge. */
  isNew?: boolean;
  /**
   * Renders its own designed navigation, so the navbar style/colour settings
   * do not apply. The editor says so rather than offering dead controls.
   */
  ownsNav?: boolean;
  /**
   * Uses its own typefaces by default but switches to the developer's chosen
   * typeface (anything but the default) when one is picked.
   */
  fontsFollowBrand?: boolean;
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
    /** Optional signature face for one showpiece element (e.g. a name band). */
    display?: string;
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
    ownsNav: true,
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
  {
    key: 'FRAME',
    ownsNav: true,
    fontsFollowBrand: true,
    isNew: true,
    label: 'Frame',
    note: 'Framed hero with a crossfading slideshow or film, and your highlights sliding across it.',
    surface: 'LIGHT',
    heroNote: 'Inset rounded hero; slideshow or video; highlights marquee; video stats band.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-geist), system-ui, sans-serif',
      body: 'var(--font-geist), system-ui, sans-serif',
      headingWeight: 700,
      headingTracking: '-0.02em',
      upperLabels: false,
    },
  },
  {
    key: 'PRESTIGE',
    ownsNav: true,
    fontsFollowBrand: true,
    isNew: true,
    label: 'Prestige',
    note: 'Deep navy and soft white with a serif face. Film hero with a glass facts bar.',
    surface: 'LIGHT',
    heroNote: 'Full-screen video hero, serif headline, key facts in a glass bar.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-marcellus), Georgia, serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 400,
      headingTracking: '0em',
      upperLabels: false,
    },
  },
  {
    key: 'GALLERY',
    ownsNav: true,
    fontsFollowBrand: true,
    isNew: true,
    label: 'Gallery',
    note: 'Soft rounded sheets on pale grey, a huge centred name and champagne-gold accents.',
    surface: 'LIGHT',
    heroNote: 'Giant centred name with the best available home floating below it.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-inter), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 400,
      headingTracking: '-0.03em',
      upperLabels: false,
    },
  },
  {
    key: 'ATELIER',
    ownsNav: true,
    fontsFollowBrand: true,
    isNew: true,
    label: 'Atelier',
    note: 'Monochrome and gallery-like. Serif with italic accents, pinned quotes, black-and-white film.',
    surface: 'LIGHT',
    heroNote: 'Photograph fading into a white text column; hairline buttons.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-cormorant), Georgia, serif',
      body: 'var(--font-geist), system-ui, sans-serif',
      headingWeight: 400,
      headingTracking: '-0.01em',
      upperLabels: true,
    },
  },
  {
    key: 'HORIZON',
    ownsNav: true,
    fontsFollowBrand: true,
    isNew: true,
    label: 'Horizon',
    note: 'Bright and airy. Rounded hero, words that light up as you scroll, an expanding list of home types.',
    surface: 'LIGHT',
    heroNote: 'Rounded inset hero with headline and two buttons.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: false,
    fonts: {
      heading: 'var(--font-inter), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 500,
      headingTracking: '-0.02em',
      upperLabels: false,
    },
  },
  {
    key: 'SKYLINE',
    ownsNav: true,
    fontsFollowBrand: true,
    isNew: true,
    label: 'Skyline',
    note: 'Crisp and modern. Film hero with an availability card, dark how-it-works band, annotated photo.',
    surface: 'LIGHT',
    heroNote: 'Inset video hero, bold headline bottom-left, availability card bottom-right.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: false,
    fonts: {
      heading: 'var(--font-manrope), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 600,
      headingTracking: '-0.02em',
      upperLabels: false,
    },
  },
  {
    key: 'RENOVATE',
    isNew: true,
    ownsNav: true,
    fontsFollowBrand: true,
    label: 'Renovate',
    note: 'Boxed and hairline-ruled with a yellow accent: a diagonal sweep reveals the hero, cards stack as you scroll and the nav darkens over dark bands.',
    surface: 'LIGHT',
    heroNote: 'Boxed hero uncovered by a diagonal light sweep, headline words rising in turn.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-inter), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 500,
      headingTracking: '-0.02em',
      upperLabels: false,
    },
  },
  {
    key: 'ACSAPTI',
    isNew: true,
    ownsNav: true,
    fontsFollowBrand: true,
    label: 'Acsapti',
    note: 'Clean white with a red accent: dark glass nav, a spinning discover badge, pop-in avatars and residence cards that widen on hover.',
    surface: 'LIGHT',
    heroNote: 'Full-bleed hero fading in from grey with a spinning circular badge.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-manrope), system-ui, sans-serif',
      body: 'var(--font-manrope), system-ui, sans-serif',
      headingWeight: 600,
      headingTracking: '-0.03em',
      upperLabels: false,
    },
  },
  {
    key: 'RIVOS',
    isNew: true,
    ownsNav: true,
    fontsFollowBrand: true,
    label: 'Rivos',
    note: 'Soft grey and fully rounded: inset photo hero, glass pill nav, staggered image grid and icon feature cards.',
    surface: 'LIGHT',
    heroNote: 'Rounded inset hero with a big headline, two figures and a glass residence card.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-inter), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 500,
      headingTracking: '-0.035em',
      upperLabels: false,
    },
  },
  {
    key: 'HOMEVIA',
    isNew: true,
    ownsNav: true,
    fontsFollowBrand: true,
    label: 'Homevia',
    note: 'Warm and quiet: the name huge and translucent behind the hero, a two-tone statement and frosted residence cards.',
    surface: 'LIGHT',
    heroNote: 'Full-bleed hero with a giant translucent wordmark and stacked glass thumbnails.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-inter), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 500,
      headingTracking: '-0.025em',
      upperLabels: false,
    },
  },
  {
    key: 'AUREVANT',
    isNew: true,
    ownsNav: true,
    fontsFollowBrand: true,
    label: 'Aurevant',
    note: 'Near-black with a coral-red accent: glass signature card, a giant lowercase wordmark and filterable residences.',
    surface: 'DARK',
    heroNote: 'Full-bleed hero, red pill, glass signature card and a giant wordmark crossing below.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-manrope), system-ui, sans-serif',
      body: 'var(--font-manrope), system-ui, sans-serif',
      headingWeight: 500,
      headingTracking: '-0.035em',
      upperLabels: false,
    },
  },
  {
    key: 'REAL',
    isNew: true,
    ownsNav: true,
    fontsFollowBrand: true,
    label: 'Real',
    note: 'Quiet and editorial: a full-photo hero with a thin row of facts, corner-ticked listings and a dark bento band.',
    surface: 'LIGHT',
    heroNote: 'Full-bleed photograph with only a thin row of facts across the top.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-inter), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 500,
      headingTracking: '-0.03em',
      upperLabels: false,
    },
  },
  {
    key: 'LUXIQ',
    isNew: true,
    ownsNav: true,
    fontsFollowBrand: true,
    label: 'Luxiq',
    note: 'A single residence presented like a product: the name running across the hero, a ruled spec table and a full-bleed gallery.',
    surface: 'LIGHT',
    heroNote: 'The name running across the hero in a wide face, a large line bottom-left.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: true,
    fonts: {
      heading: 'var(--font-manrope), system-ui, sans-serif',
      display: 'var(--font-unbounded), var(--font-manrope), sans-serif',
      body: 'var(--font-manrope), system-ui, sans-serif',
      headingWeight: 500,
      headingTracking: '-0.01em',
      upperLabels: false,
    },
  },
  {
    key: 'NOIR',
    ownsNav: true,
    fontsFollowBrand: true,
    isNew: true,
    label: 'Noir',
    note: 'Black and white with heavy type, two-way marquees and a giant italic wordmark.',
    surface: 'LIGHT',
    heroNote: 'Full-bleed dark hero with a heavy headline bottom-left.',
    ownsHero: true,
    banded: false,
    sectionHeadings: true,
    airy: false,
    fonts: {
      heading: 'var(--font-inter), system-ui, sans-serif',
      body: 'var(--font-inter), system-ui, sans-serif',
      headingWeight: 500,
      headingTracking: '-0.03em',
      upperLabels: false,
    },
  },
];

export const DEFAULT_TEMPLATE = 'CLASSIC';

/** Picker order: the newest designs first, the established ones after. */
export const PICKER_TEMPLATES: MiniSiteTemplate[] = [
  ...MINI_SITE_TEMPLATES.filter((t) => t.isNew),
  ...MINI_SITE_TEMPLATES.filter((t) => !t.isNew),
];

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
    // A faintly warm off-white rather than pure #fff.
    //
    // Pure white gives a page no depth: every card is the same value as the
    // ground it sits on, so the only thing separating them is a hairline
    // border, and the result reads as a wireframe. A ground a couple of points
    // down from white lets white cards lift off it — the arrangement every
    // premium property brand uses — and costs nothing but this hex.
    bg: '#fbfaf9',
    panel: '#ffffff',
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
export function templateFontVars(
  template: MiniSiteTemplate,
  brandFont?: { key: string; heading: string; body: string },
): Record<string, string> {
  // MODERN is the default the editor seeds, so it means "no choice made":
  // the template keeps its own type. Any other pick replaces it.
  const brand = template.fontsFollowBrand && brandFont && brandFont.key !== 'MODERN' ? brandFont : null;
  return {
    '--tpl-font-heading': brand ? brand.heading : template.fonts.heading,
    '--tpl-font-body': brand ? brand.body : template.fonts.body,
    '--tpl-font-display': brand ? brand.heading : (template.fonts.display ?? template.fonts.heading),
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
