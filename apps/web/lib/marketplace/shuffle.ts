import type { Property } from '../types';

/**
 * Vary the order of results between visits, without making it a lottery.
 *
 * Two things are in tension. Every developer pays the same listing fee, so a
 * fixed order permanently advantages whoever sits at the top — and with a
 * stable sort that is the same company every time anyone loads the page. But
 * a genuinely new development is also the most useful thing to show, and pure
 * shuffling buries it as often as it promotes it.
 *
 * So: newer listings get a higher weight, and the order is drawn against those
 * weights. A recent development will usually appear near the top and
 * occasionally will not; an older one will usually be lower and occasionally
 * surfaces. Over many visitors the exposure is spread rather than won once.
 */

/** Below this age a listing carries full weight. */
const FRESH_DAYS = 30;
/** Beyond this it carries the floor weight. */
const STALE_DAYS = 180;

const DAY = 24 * 60 * 60 * 1000;

/**
 * Weight from age: 1.0 when new, easing to 0.25 once well established.
 *
 * The floor is deliberately non-zero. A development that has been listed for a
 * year is still for sale, and a weight of zero would mean it never appears
 * above a newer one no matter how many times the page is loaded.
 */
function weightFor(property: Property, now: number): number {
  const created = new Date(property.createdAt).getTime();
  if (Number.isNaN(created)) return 0.5;

  const ageDays = Math.max(0, (now - created) / DAY);
  if (ageDays <= FRESH_DAYS) return 1;
  if (ageDays >= STALE_DAYS) return 0.25;

  // Linear between the two bounds — nothing here justifies a curve.
  const t = (ageDays - FRESH_DAYS) / (STALE_DAYS - FRESH_DAYS);
  return 1 - t * 0.75;
}

/** Small deterministic PRNG, so one seed reproduces one ordering exactly. */
function mulberry32(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Order by weighted random selection.
 *
 * Each listing draws a key of `random ^ (1 / weight)`, and sorting by that key
 * descending is a weighted sample without replacement — a heavier item is more
 * likely to land near the front, but nothing is guaranteed a position.
 *
 * Featured listings are held at the top regardless. They are a paid placement,
 * so their position is the thing being paid for and must not be shuffled away.
 */
export function weightedShuffle(properties: Property[], seed: number): Property[] {
  const now = Date.now();
  const rand = mulberry32(seed);

  const keyed = properties.map((property) => {
    const weight = Math.max(0.01, weightFor(property, now));
    const r = rand();
    return {
      property,
      featured: !!property.isFeatured,
      // Guard against r === 0, where Math.log would be -Infinity.
      key: Math.pow(r === 0 ? Number.EPSILON : r, 1 / weight),
    };
  });

  return keyed
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.key - a.key;
    })
    .map((k) => k.property);
}

/**
 * The seed drawn for this page load.
 *
 * Module-scoped, which is exactly the lifetime the order needs: it survives
 * every re-render and every page change within the app, and is discarded when
 * the document is thrown away — that is, on a refresh.
 */
let loadSeed: number | null = null;

/**
 * A different order on every refresh, a stable one while browsing.
 *
 * A fixed order makes whatever sits below the fold effectively undiscoverable:
 * the same developments lead every time, and every developer pays the same
 * listing fee for that placement. So the order is drawn afresh each time the
 * page is loaded.
 *
 * It deliberately does not change *within* a load. Paging to page 2 and back,
 * or any re-render, reuses the same seed — a reshuffle underfoot would look
 * like listings disappearing. This was previously held in sessionStorage,
 * which survives a refresh, so the order never actually changed until the tab
 * was closed. Module state has the lifetime that was intended.
 */
export function browseSeed(): number {
  // Server render: a constant, so the markup the client hydrates against
  // matches. The client draws the real seed on mount.
  if (typeof window === 'undefined') return 0;

  if (loadSeed === null) {
    loadSeed = Math.floor(Math.random() * 2 ** 31);
  }
  return loadSeed;
}
