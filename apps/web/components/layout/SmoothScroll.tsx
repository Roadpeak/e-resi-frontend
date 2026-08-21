'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

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

    lenisRef.current = lenis;

    // Start Lenis at the top too, immediately and without animating, so its
    // internal position matches the window we just reset.
    lenis.scrollTo(0, { immediate: true });

    // No scrollerProxy here, deliberately.
    //
    // In this configuration Lenis drives the NATIVE window scroll — it eases
    // window.scrollY rather than transforming the page (document.body has no
    // transform, and window.scrollY genuinely moves). ScrollTrigger's default
    // viewport handling is therefore already correct.
    //
    // An earlier attempt proxied document.body and made it the default
    // scroller. That was wrong: the page scrolls on documentElement, so
    // document.body.scrollTop is permanently 0 while window.scrollY is not.
    // ScrollTrigger then read position from an element that never moves, and
    // the pinned sections froze mid-animation once the two diverged — the
    // hero's video stopped scrubbing while its pin stayed engaged.
    //
    // Telling ScrollTrigger *when* to re-read is all that is needed, and that
    // is what the scroll subscription below does.

    // Hook Lenis into GSAP's ticker so ScrollTrigger syncs perfectly
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Keep Lenis's own measurements in step with ScrollTrigger's. A pin changes
    // document height as it engages and releases; if Lenis does not re-measure,
    // its scroll limit is stale and it clamps against the wrong page height.
    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener('refresh', onRefresh);

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
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      gsap.ticker.remove(raf);
      lenisRef.current = null;
      lenis.destroy();
    };
  }, []);

  // A client-side navigation tears down the previous page's pinned sections and
  // mounts new ones, but this component does not remount — so nothing reset the
  // scroll position or re-measured the new page's triggers. Lenis kept the old
  // offset while the fresh pins were measured against it, which is why leaving
  // the page and coming back reproduced the glitch without a reload.
  //
  // Skips the very first run: the mount effect above already does both, and
  // refreshing twice during mount is wasted work.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    lenisRef.current?.scrollTo(0, { immediate: true });

    // Wait for the incoming page's own effects to build their triggers, and for
    // the browser to lay the new content out, before measuring. Two rAFs: the
    // first still runs before paint, the second after it.
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        lenisRef.current?.resize();
        ScrollTrigger.refresh();
      });
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}
