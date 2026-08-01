'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const tween = gsap.fromTo(
      content,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power1.out' },
    );

    return () => { tween.kill(); };
  }, [pathname]);

  return <div ref={contentRef}>{children}</div>;
}
