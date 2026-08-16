'use client';

import { useEffect, useState } from 'react';
import { Monitor, X } from 'lucide-react';

const KEY = 'e-resi-tour-hint';

interface Props {
  /** CINEMATIC | 3D | VR — only the wording differs. */
  tour: 'CINEMATIC' | '3D' | 'VR';
}

/**
 * A one-time note on phones that the tour is built for a larger screen.
 *
 * Deliberately a hint and not a gate. Most of the people these tours exist
 * for — diaspora buyers deciding from another country — are on phones, and
 * turning them away would cost the audience the tours were built to reach.
 * So this sets expectations and gets out of the way: dismissed once, never
 * shown again.
 *
 * VR gets firmer wording because a phone genuinely is a poor headset;
 * cinematic and 3D play perfectly well on a modern handset, they are simply
 * better with room to see detail.
 */
const COPY: Record<Props['tour'], string> = {
  CINEMATIC: 'This tour is built for a larger screen — on a laptop or tablet you will see far more of the detail.',
  '3D': 'You can explore this on your phone, but a laptop or tablet gives you a much better sense of the space.',
  VR: 'For the full VR experience, open this on a desktop with a headset. On a phone you can still look around, but not step inside.',
};

export function SmallScreenHint({ tour }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Phones only. A tablet has the room this is asking for, so 768px rather
    // than a broader mobile breakpoint.
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      // Private browsing throws — showing the hint once per session is a
      // reasonable outcome, so carry on rather than bailing.
    }
    // Let the tour paint before interrupting it.
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // Nothing to do; it will simply appear again next visit.
    }
  }

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-4 z-[70] flex items-start gap-3 rounded-2xl border border-white/15 bg-black/85 p-3.5 text-white shadow-2xl backdrop-blur-md md:hidden"
    >
      <Monitor size={17} className="mt-0.5 shrink-0 opacity-80" />
      <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-white/90">
        {COPY[tour]}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <X size={15} />
      </button>
    </div>
  );
}
