/**
 * Agent referral capture.
 *
 * An agent shares a link carrying `?ref=<agentProfileId>`. Whoever follows it
 * and later enquires, books a viewing or reserves a unit is credited to that
 * agent — which is the whole basis of a partnership, and until now was
 * tracked nowhere.
 *
 * The referral has to outlive the URL that carried it. Someone arrives on a
 * shared link, browses three units, opens the tour, and only then fills in a
 * form — by which point the query string is long gone. So it is captured on
 * arrival and stored, rather than read at submit time.
 */

const KEY = 'e-resi-ref';

/** How long a referral stays credited to the agent who introduced the visit. */
const TTL_DAYS = 30;

interface StoredRef {
  agentId: string;
  /** When the link was followed, so the credit can expire. */
  at: number;
}

/**
 * Agent profile ids are cuids. Validating the shape keeps arbitrary strings
 * from being stored and posted back to the API as an agent id.
 */
function looksLikeId(v: string): boolean {
  return /^[a-z0-9]{20,32}$/i.test(v);
}

/**
 * Read `?ref=` from the current URL and remember it.
 *
 * Deliberately does NOT overwrite an existing referral: if two agents share
 * the same development, the one who actually introduced the visitor is the
 * one whose link they followed first. Last-touch would let a later share
 * quietly take another agent's credit.
 */
export function captureReferral(): void {
  if (typeof window === 'undefined') return;
  try {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref || !looksLikeId(ref)) return;
    if (getReferral()) return;
    const value: StoredRef = { agentId: ref, at: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Private browsing can throw on localStorage. A referral that cannot be
    // stored simply is not credited — never break the page over it.
  }
}

/** The agent id to credit, or null. Expired referrals are cleared. */
export function getReferral(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRef;
    if (!parsed?.agentId || !looksLikeId(parsed.agentId)) return null;
    if (Date.now() - parsed.at > TTL_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed.agentId;
  } catch {
    return null;
  }
}

/**
 * Spread into a lead submission. Returns `{}` when there is no referral, so
 * callers do not have to branch — and so a body never carries `agentId:
 * undefined`, which some validators treat differently from an absent key.
 */
export function referralPayload(): { agentId?: string } {
  const agentId = getReferral();
  return agentId ? { agentId } : {};
}

/** Build a shareable link for an agent. Used by the agent's own dashboard. */
export function buildReferralUrl(path: string, agentId: string, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const url = new URL(path.startsWith('http') ? path : `${base}${path}`);
  url.searchParams.set('ref', agentId);
  return url.toString();
}
