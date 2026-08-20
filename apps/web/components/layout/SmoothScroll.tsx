'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Own scroll restoration here rather than in the pinned section. A restored
    // mid-page offset is measured by every pin built during mount, and Lenis
    // keeps its own scroll position — so resetting the window alone leaves the
    // two disagreeing. Disable the browser's restore before Lenis reads it.
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    if (window.scrollY > 0) window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    // Start Lenis at the top too, immediately and without animating, so its
    // internal position matches the window we just reset.
    lenis.scrollTo(0, { immediate: true });

    // Hook Lenis into GSAP's ticker so ScrollTrigger syncs perfectly
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Lenis is created in an effect, so any ScrollTrigger built during a child's
    // mount (the hero, when its video is cached) measured the page before smooth
    // scrolling existed. Re-measure once Lenis is driving, so pin distances are
    // computed against the scroller that actually moves the page.
    ScrollTrigger.refresh();

    // A pinned, scrub-driven hero also has to be re-measured whenever the
    // viewport changes — a phone's URL bar collapsing counts, and it otherwise
    // leaves the pin sized for a viewport that no longer exists.
    let resizeId: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeId);
      resizeId = setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener('resize', onResize);

    // Late-arriving fonts and images change the height of everything below the
    // pin, which shifts where it should end.
    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    return () => {
      // must remove the same reference we added, or the ticker keeps driving a dead Lenis
      clearTimeout(resizeId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onLoad);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
