'use client';

import { useEffect, useState } from 'react';

/**
 * Whether this visitor reached the page from our marketplace, rather than from
 * a link the developer shared.
 *
 * The distinction matters because a development's pages are the developer's own
 * sales site. Someone who arrived from a WhatsApp link should see the
 * development's brand and nothing that leads them to rival listings; someone
 * already browsing e-resi should keep their way back.
 *
 * Deliberately biased towards "not from the marketplace". document.referrer is
 * empty for a direct open, a WhatsApp tap, and anywhere the referrer is
 * stripped — which is most of the traffic a shared link actually gets. Guessing
 * wrong in that direction only costs a "back" link; guessing wrong the other
 * way puts our branding, and links to competing developments, on a page the
 * developer is paying us to make theirs.
 *
 * Returns false on the server and on first paint, so the marketplace chrome
 * fades in for the few visitors who warrant it rather than flashing away for
 * everyone else.
 */
export function useArrivedFromMarketplace(propertySlug: string): boolean {
  const [fromMarketplace, setFromMarketplace] = useState(false);

  useEffect(() => {
    try {
      const ref = document.referrer;
      if (!ref) return;
      const url = new URL(ref);
      // Same origin, but not another page of this same development: moving
      // between a development's own pages is not "arriving from e-resi".
      if (
        url.origin === window.location.origin
        && !url.pathname.startsWith(`/${propertySlug}`)
      ) {
        setFromMarketplace(true);
      }
    } catch {
      // A malformed referrer is not worth failing over — treat it as a cold
      // arrival, which is the safe default.
    }
  }, [propertySlug]);

  return fromMarketplace;
}
