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
      {
        opacity: 1,
        duration: 0.3,
        ease: 'power1.out',
        // Strip the inline opacity once the fade finishes. An element with an
        // opacity below 1 is a containing block for its position:fixed
        // descendants, and ScrollTrigger pins this page's sections with
        // pinType:'fixed'. Leaving `opacity: 1` on the wrapper keeps the
        // browser treating it as a compositing/containing context, so the pins
        // resolve against this div rather than the viewport — which is why the
        // hero and showcase glitched after navigating back to the page.
        clearProps: 'opacity',
        onInterrupt: () => gsap.set(content, { clearProps: 'opacity' }),
      },
    );

    return () => {
      tween.kill();
      // A navigation away mid-fade would otherwise leave the wrapper stuck
      // partially transparent, and so still a containing block.
      gsap.set(content, { clearProps: 'opacity' });
    };
  }, [pathname]);

  return <div ref={contentRef}>{children}</div>;
}
