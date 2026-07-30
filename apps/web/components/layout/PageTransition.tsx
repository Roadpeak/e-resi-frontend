'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    // Push in from right → cover → push out to left
    const tl = gsap.timeline();
    tl.set(overlay, { x: '100%', display: 'block' })
      .to(overlay, { x: '0%', duration: 0.45, ease: 'power3.inOut' })
      .to(overlay, { x: '-100%', duration: 0.45, ease: 'power3.inOut', delay: 0.05 })
      .set(overlay, { display: 'none' });

    return () => { tl.kill(); };
  }, [pathname]);

  return (
    <>
      {/* Transition overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] pointer-events-none hidden"
        style={{ background: '#0a0a0a' }}
      />
      {children}
    </>
  );
}
